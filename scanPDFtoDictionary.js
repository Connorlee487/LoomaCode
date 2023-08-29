/*
LOOMA 
Filename: ScanPDFtoDictionary.js
Programmer name: Skip
Owner: Looma Education Company
Date: AUG 2022
Revision: 1.0
to run: node.js ScanPDFtoDictionary.js
adjust filter at line 261 to limit to one book, one class, one subject or all textbooks
NOTE: needs some modification to run on text files (like lists of words that are not PDF and no ch_ids0

Overview: read all textbooks,
        process each book chapter by chapter,
        get all words of each chapter,
        for each word
            if in mongo
                then update ch_id,
                else insert in mongo with def and translation
Pseudo code:
    get all textbooks from mongo
    for each book in textbooks
        prefix = book.prefix
        subject = prefix.match('/^\d+(\W*)\d/')
        get all chapters from mongo
        sort chapters (by pn or ch_id)
        chapter = first chapter
        pagenum = PN of chapter
        ch_id = ID of chapter
        while pagenum <= last page of last chapter
            words = pdf2json(PDF.getPage(pagenum))
            wordset = new Set(words)
            for each word in SET
                process(word)
            pagenum++
            if pagenum > chapter.pn + chapter.len
                chapter = next(chapter)
                pagenum = PN of chapter
                ch_id = ID of chapter
        process (word)
            lookup word in mongo
            if in mongo
                if ch_id LESS THAN mongoword.ch_id
                    mongoword.ch_id = ch_id
                    update in mongo
            else //new word
                get def (word)
                get trans (word)
                insert word in mongo
 */

const fs    = require('fs');
const axios = require('axios');
const PDF   = require("pdfjs-dist");

const MongoDB = require('mongodb');
const mongoClient = MongoDB.MongoClient;
const mongoURL = "mongodb://127.0.0.1:27017";
var database, db;

let bookcount ,chaptercount, wordcount, changedwordcount, newwordcount, nonwordcount;
let chapteroldwords, chapternewwords, chapternonwords;

let summary = [];
let today = new Date().toJSON().slice(0, 10);

function earlierCH_ID(newch_id, oldch_id) {

    // there are many possible methods
    // method 1: chained if-then-else's
    // method 2: weighted signature = 10000 * class + 100 * section + chapter can be compared
    // method 3: add "0" to the front of [1-9] class ch_ids and then string compare will work
    // none of these are valid for mismatched subjects
    
    newch_id = newch_id ? newch_id : "";
    oldch_id = oldch_id ? oldch_id :  "99XXX00"; // if old ch_id isnt set, use a very value to force replacement
  
    let newCH = /^\d[A-Z]/.test(newch_id) ? ('0' + newch_id) : newch_id;  // add a leading '0' if grade is in {1-9}
    let oldCH = /^\d[A-Z]/.test(oldch_id) ? ('0' + oldch_id) : oldch_id;  // add a leading '0' if grade is in {1-9}
   
    if (newch_id.length !== oldch_id.length) {
        //console.log('OUTPUT: oldCH ' + oldCH + ' is different length than newCH ' + newCH);
        return true;
    } // if newer book added sections, replace ch_id
    
    //console.log('OUTPUT: oldch_id is ' + oldch_id + '  and newch_id is ' + newch_id);
    //console.log('OUTPUT: oldCH is ' + oldCH + '  and newCH is ' + newCH);
    
    //if (oldCH.localeCompare(newCH) > 0) console.log('OUTPUT: oldCH ' + oldCH + ' is alpha greater than newCH ' + newCH);
    
    return (oldCH.localeCompare(newCH) > 0);  //returns positive int if oldCH is alpha greater than newCH
};  // end earlierCH_ID()

async function updateEntry(entry, ch_id, subject) {
    let old="";
    //console.log('OUTPUT:  processing "' + entry.en + '" of chapter ' + ch_id);
    
    if (('ch_id' in entry) && (entry.ch_id.some( (x) => subject in x)))
        old = entry.ch_id.find( (x) => subject in x)[subject];
    //if ( ! ('ch_id' in entry)) console.log('OUTPUT:  ' + 'no ch_id in ' + entry.en);
    //if (  ! (entry.ch_id.some( (x) => subject in x))) console.log('OUTPUT:  ' + 'no ' + subject + ' in ' + entry.ch_id);
    
    if ( ! ('ch_id' in entry) || ! (entry.ch_id.some( (x) => subject in x)) || earlierCH_ID(ch_id, old)) {
        //console.log('OUTPUT:  ' + 'replacing old ch_id: ' + entry.en + ' from ' + old +' to ' + ch_id);
        if ( ! ('ch_id' in entry)) entry.ch_id = [];
        entry.ch_id[subject] = ch_id;
        entry.date = today;
       // *****
        changedwordcount++;
        await db.collection("dictionaryV3").updateOne({'_id':entry._id}, {$set:entry});

    } //else console.log('OUTPUT: new ' + ch_id + ' is greaterthan  or equal existing ch_id ' + old);
}  // end updateEntry()

async function newEntry(word, ch_id, subject) {
    let meanings = await getDefinitions(word);
    let nepali =   await getTranslation(word);
    
    if (nepali === word && meanings === 'error') {
        chapternonwords++; nonwordcount++;
        fs.appendFile('/tmp/nonwords', word+'\n', error);
    
        console.log('OUTPUT:    found non word ' + word + ' in ' + ch_id);
    } else {
        chapternewwords++;
        if (meanings === 'error') meanings = [];
        if (nepali === word) nepali = '';
        let newword = {'en': word, 'np': nepali, 'meanings': meanings, 'ch_id': [{subject: ch_id}], 'date': today};
        console.log('OUTPUT:  new word ' + word + ', translation is ' + nepali);
        if (meanings.length > 0) console.log('       first meaning is (' + meanings[0].part + ') ' + meanings[0].def);
    
        newwordcount++;
        fs.appendFile('/tmp/newwords', word+'\n',error);
        db.collection("dictionaryV3").insertOne(newword);
    }
}  // end newEntry()

async function lookup(word) {
    let entry = await db.collection("dictionaryV3").findOne({'en':{'$regex':('^' + word + '$'),'$options':'i'}});
    return entry;
}; // end lookup()

async function getDefinitions(word){ // Definition Function
    let definitions, def, pos;
    let results = [];
    definitions = await axios.get('https://api.dictionaryapi.dev/api/v2/entries/en/' + word).then(result => {
        return result.data[0] // Returns JSON of data
    }).catch(error => { console.log("ERROR DEF " + word) });
    
    if (definitions && 'meanings' in definitions) {
        for (variation of definitions.meanings) {
            pos = variation.partOfSpeech.replace(/\.|\,|\!|\(|\)|\?/g, "");
            def = variation.definitions[0].definition.replace(/\.|\,|\!|\(|\)|\?/g, "");
            results.push({'part': pos, 'def': def});
        }
        ;
        return results;
    } else return "error";
};  // end getDefinitions()

async function getTranslation(word){
    let apikey = "AIzaSyCvNeqrsx8rafC15a5p0-d96Is--75kWU0"; // from RAPIDapi.com 2022 09 07
    const res = await axios.get('https://www.googleapis.com/language/translate/v2?key=' + apikey + '&source=en&target=ne&q=' + word).then(result => {
        return result.data // Returns translation
    }).catch(error => {
        console.log('OUTPUT:  ' + "ERROR: translating " + word + ' :' + error)
    })
    return res.data.translations[0].translatedText; // Returns translation
}; // end getTranslation()

async function processWord(word, ch_id, prefix) {
    let entry;
    let subject = prefix.match(/^\d+([A-Za-z]*)/)[1];
    //console.log('OUTPUT: processing ' + 'word: ' + word);
    if ( word.length > 1 && !(/^\d/.test(word))) {  // if word not a number && length > 1)
        wordcount++;
        if (entry = await lookup(word)) {  // lookup word in dictionary
            chapteroldwords++;
            //console.log('OUTPUT:     existing word ' + word + ' in subject ' + subject);
            await updateEntry(entry,ch_id,subject); // if present, update ch_id
        } else { // new word, not in dictionary
            //console.log('OUTPUT:           new word ' + word + ' in subject ' + subject);
            await newEntry(word, ch_id, subject); // else new dictionary entry
        }
    }
};  // end processWord()

async function getChapterText(pdf, ch_id, start, len){
    // derived from https://stackoverflow.com/questions/40635979/how-to-correctly-extract-text-from-a-pdf-using-pdf-js
    let pagework = []; // collecting all page promises
    
    let end = start*1 + len*1; // *1 to coerce to number
    for (var j = start; j < end; j++) {
        
        //console.log ('OUTPUT:  ' + 'chapter ' + ch_id + ' page # ' + j);
        
        if (j > pdf.numPages) {  // this patches a bug in PDF formatting of some textbooks (9Ma, 9Sa, 9ENa, 10Ma, 10Sa and 10ENa)
            console.log('OUTPUT:  ' + 'PAGENUM ERROR: in ' + ch_id + ' start ' + start + ' len ' + len + ' j ' + j + ' book has ' + pdf.numPages + ' pages');
            break;
        }
        
        let page = pdf.getPage(j).catch(function(ex){console.log('OUTPUT:  ' + 'failed getPage with page = ' + j);console.log(ex);});
        
        pagework.push(page.then(function(page) { // add page promise
            var textContent = page.getTextContent();
            return textContent.then(function(text){ // return content promise
                return text.items.map(function (s) { return s.str; }).join(' '); // value page text
            });
        }));
    }
    
    // Wait for all pages and join text
    return Promise.all(pagework).then(function (texts) {
        return texts.join(' ');
    });
};  // end getChapterText()

async function processChapter (text, ch_id, prefix) {

    chapteroldwords = 0; chapternewwords = 0; chapternonwords = 0;
    // clean up text, sort, uniq, then process each word
    // remove punctuation and whitespace
    text = text.replace(/[\W_]/g, " ").trim(); // note: removed .toLowerCase() so that e.g. "Sunday" will stay cap's
    let words = text.split(' ');
    let unique = new Set(words);
    words = Array.from(unique).sort();  // only for convenience reading output
    
    for (let i=0; i<words.length;i++) await processWord(words[i], ch_id, prefix);
    
    summary.push({prefix:prefix, ch_id:ch_id, old:chapteroldwords, new:chapternewwords, nonwords:chapternonwords});
}; // end processChapter()

async function processBook (name, prefix, book) { // "book" is pdf.js parse of a textbook's PDF
    console.log('OUTPUT:  ' + 'Book ' +  name + ' loaded. Number of Pages = ' + book.numPages);
    const regex = "^" + prefix + "\\d";
    let chapters = await db.collection("chapters").find({_id: {$regex: regex}}).toArray();
    for (const chapter of chapters) {
        chaptercount++;
        const text = await getChapterText(book, chapter._id, chapter.pn, chapter.len);
        await processChapter(text, chapter._id, prefix);
    };
    return true;
} // end processBook()

function close() {
    console.log('OUTPUT:  ' + 'processed ' + bookcount + ' books, and ' + chaptercount + ' chapters');
    console.log('OUTPUT:  ' + ' total words ' + wordcount +
                              ' ch_ids updated ' + changedwordcount +
                              ' new words ' + newwordcount +
                              ' non-words ' + nonwordcount);
    
    for (log of summary) {console.log('OUTPUT:  ' + 'SUMMARY: ' + log.prefix + '  ' +
                log.ch_id + '   existing ' + log.old + '   new ' + log.new, ' non-words ' +log.nonwords)};
   
    database.close(); // close connection to db

} // end close()

function error(err) {if (err) console.error(err); };

////////////    MAIN    ////////////////
async function main() { // Main function
    var books;
    let book, chapters, chapter, pagenum, words, word, prefix, ch_id;
    let work = [];
    const directory = '/usr/local/var/www/content/';
    
    database = await mongoClient.connect(mongoURL);
    db = database.db("looma");
    
    fs.writeFile('/tmp/newwords', 'New words found:\n',error);
    fs.writeFile('/tmp/nonwords', ' Non words fount:\n',error);
    
    books = await db.collection("textbooks").find({}).toArray();
    //books = Array.from(books).sort(); // not sure what this sorts on. "for-of" may not preserve order anyway
    bookcount = 0; chaptercount = 0; wordcount = 0; changedwordcount = 0; newwordcount = 0; nonwordcount = 0;
    for (const book of books) {
        if (book.fn && book.fn !== ""
            && (book.fn === "English_6_9577.pdf"  )
        ) {  // only scan books that are in English (e.g. have FN set)
            bookcount++;
            //console.log(book.fn);
            let url = directory + book.fp + book.fn;
            //TRYING: ignoreErrors: true into the getDocument
            var pdfbook = PDF.getDocument(url,{ignoreErrors:true});
            work.push(pdfbook.promise.then(async function (doc) {
                await processBook(book.fn, book.prefix, doc);
            }));
        }
    };
    
    Promise.all(work).then(close);
} // end MAIN()
main();