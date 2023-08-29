/*
LOOMA 
Filename: textbookWords.js
Description: run by allBooks.sh
	
	reads file bookPDf.txt, determines the ch_id and page of each word, and writes file unknownWords.json
	format of unknownWords.json: an array with each word, its ch_ids by subject and list of subjects it appears in
	 {"word":"break"},
	{"CHID":[{"EN":"1EN01.01"},{"CS":"10CS01.01"},{"ENa":"10EN01"},{"Ma":"10Ma01.01"},
	      {"Sa":"10Sa01"},{"M":"4M01.01"},{"SS":"4SS01.03"},{"SSa":"6SSa01.00"},{"V":"6V01.01"},{"H":"7H01.01"}]},
	 {"uniqueBooks":"[\"EN\",\"CS\",\"ENa\",\"Ma\",\"Sa\",\"M\",\"SS\",\"SSa\",\"V\",\"H\"]"}]}

Programmer name: Connor L
Owner: Looma Education Company
Date: AUG 2022
Revision: 1.0
 */

const fs = require("fs")
//------------------------------------------------------------------------------------

function deleteEmpty(wordPage){
    for(key of wordPage.keys()){ // Deletes entries with no corresponding page #'s
        if(wordPage.get(key).size == 0){
            wordPage.delete(key)
        }
    }
}  // end deleteEmpty()

function getPageNum(words, map){ // Gets the index of page numbers of the textbook
    
    const regex = new RegExp('-*Page \\((\\d*)', 'g') // Regex for getting page number

    var pageIndex = new Map() // Creates map of page - index of page

    for(page of words.matchAll(regex)){ // Adds into map
        pageIndex.set(page[1], page.index)
    }

    return pageIndex
}  //end getPageNum()

function getWords(words, wordPage){ // Gets all the words from bookPDF.txt

    for(word of words.replace(/\n/g, " ").split(" ")){ // Replaces newline with space
    
        if((word.charCodeAt(0) > 96 && word.charCodeAt(0) < 123) || (word.charCodeAt(0) > 64 && word.charCodeAt(0) < 91)){ // Checks if first letter is a number
            
            word = word.replace(/\.|\,|\!|\(|\)|\?/g, " ") // Replaces punctuation
            word = word.replace(/\W/g, " ").toLowerCase().trim() // Changes to lowercase and removes whitespace

            wordPage.set(word) // Adds word to map
        }
    }
    return wordPage // Returns map
}  //end getWords()

function getPageFromIndex(currPage, pageIndex){ // Get page based on the index

    var FINAL_PAGE_NUM = -1
    
    for(page of pageIndex.keys()){ // Loops through keys of map
        if(currPage < pageIndex.get(page)){ // Checks index of curr page with index of map
            FINAL_PAGE_NUM = parseInt(page)

            break
        }
    }
    
    return FINAL_PAGE_NUM + 1 // returns page number
}  //end getPageFromIndes()

function getOccurrences(wordPage, words, pageIndex){ // Gets all occurences of word

    var regex
    
    for(word of wordPage.keys()){ // Loops through map of unique words
        var pageOfWord = new Set() // Creates a new set to store page numbers

        regex = new RegExp('\\b' + word.slice(0,1).toLowerCase() + word.slice(1) + '\\b|\\b' + word.slice(0,1).toUpperCase() + word.slice(1) + '\\b', 'gm') // Regex of case insensitive

        var count = 0
        for(match of words.matchAll(regex)){ // Loops through each occurence of word in bookPDF.txt

            if(count < 5){
                pageOfWord.add(getPageFromIndex(match.index, pageIndex)) // Calls getPageFromIndex to get the page number and adds to set
            }else{
                break
            }
            
            count++
        }

        wordPage.set(word, pageOfWord) // Adds word that maps to set of page numbers
    }

    return wordPage
}  //end getOccurances()

async function getChapter(textbook) { // Connect to mongo to get chapter info
    // given a textbook's filepath, retrieves the 'prefix' and returns an array of chapters that match that prefix
    
    const MongoClient = require('mongodb').MongoClient, url = "mongodb://localhost:27017/"

    const db = await MongoClient.connect(url), dbo = db.db("looma") // Name of db

    var result = []

    const exists = await dbo.collection("textbooks").countDocuments({fp:textbook}) // Name of collection
    
    if(exists != 0){
        const getPrefix = await dbo.collection("textbooks").findOne({fp: textbook}) // Finds current textbook to get ch_id
        const getRegex = "^" + getPrefix.prefix // First part of ch_id example: 1EN01.00 -> 1EN
    
        result = await dbo.collection("chapters").find({_id: {$regex: getRegex}}).toArray() // Finds all of ch_id under a single texbook
    }

    db.close()

    return result // Returns array of chapters [including ch_id's]
}  //end getChapter()

async function getChapterList(textbook, subject) {
    try {
        var words = fs.readFileSync("bookPDF.txt").toString() // Reads text file of pdf of book
        var wordList = JSON.parse(fs.readFileSync('unknownWords.json'))

        var pageIndex = new Map() // Map for {Page: Index}

        var wordPage = new Map() // Map for {Word: Pages found}
        var chaptersPage = new Map() // Map for {Page: Chapter ID}

        const regexID = new RegExp('(\\D+)', '')

        for(entry of await getChapter(textbook)){ // Gets the CHID of the corresponding section ex: Class1 English is 1EN01, 1EN02, etc.
            chaptersPage.set(parseInt(entry.pn) + 1, entry._id)
            subject = entry._id.match(regexID)[1].toString()
        }

        pageIndex = getPageNum(words, pageIndex) // Calls getPageNum to get the page number of textbook
        wordPage = getWords(words, wordPage) // Calls getWords to clean and retrieve words in textbook

        getOccurrences(wordPage, words, pageIndex) // Gets all occurences of word and updates wordPage(map) of word -> page #'s
        deleteEmpty(wordPage) // Deletes words with no corresponding page numbers (False words)

        var existing = false // Variable to see if repeated word
        var CHID, firstPage // ch_id and page of first occurence 

        for(currWord of wordPage.keys()){ // For every word 
            
            CHID = "N/A" // Sets ch_id as N/A 
            firstPage = Array.from(wordPage.get(currWord))[0] // First page

            for(id of chaptersPage.keys()){ // Gets ch_id
                
                if(firstPage <= id){
                    CHID = chaptersPage.get(id)

                    break // breaks after finding first
                }
            }

            for(each of wordList.entries){ // For every word in current JSON
                
                if(each.entry[0].word === currWord){ // Sees if word already exists 
                    existing = true

                    var tempSet = new Set(JSON.parse(each.entry[2].uniqueBooks)) // Takes set of uniqueBooks

                    if(!tempSet.has(subject) && CHID !== "N/A"){
                        // Updates the ch_id and uniqueBooks if uniqueBooks hasn't appeared before
                        // Example:
                            // 1EN01 -> uniqueBooks -> EN
                            // 2EN01 -> uniqueBooks -> EN
                            // Repeat so entry will not be changed

                        each.entry[1].CHID.push({[subject.toString()]: CHID})
                        each.entry[2].uniqueBooks = JSON.stringify(Array.from(tempSet.add(subject)))
                    }

                    break
                }

            }


            if(!existing){ // If doesn't exists 

                wordList.entries.push({"entry" : [ 

                    {"word": currWord}, // New entry to word 
                    {"CHID": [{[subject.toString()]: CHID}]}, // New array with current ch_id 
                    {"uniqueBooks": JSON.stringify(Array.from(new Set().add(subject)))} // New set of uniqueBooks
                
                ]})

            }

            existing = false // Resets existing to false for next word

        }

        fs.writeFileSync("unknownWords.json", JSON.stringify(wordList)) // Writes to unknownWords.json
        
    } catch (error) {
        console.log(error)
    }
}  //end getChapterList()

//-----------------------   MAIN CODE   -------------------------------------------------------------

const textbook = process.argv[2].toString() // gets which section textbook is in
const regexBook = new RegExp('(textbooks\\/Class\\d+\\/\\w+)', 'gm') // Regex for book
const regexName = new RegExp('\\/textbooks\\/Class\\d+\\/(\\w+)') // Regex for name of book


if(textbook.match(regexBook) != null){ // If words comes from textbook
    getChapterList(textbook.match(regexBook)[0].toString() + "/", textbook.match(regexName)[1]) // Start if textbook exists
}else{
    getChapterList("N/A", "N/A") // Start if words doesn't come from textbook
}

/*  FORMAT of output file: unknownWords.json:

{"entries":[
    {"entry":[
        {"word":"WORD"},
        {"uniqueBooks":"NAME"},		NOTE: uniqueBooks is not used later, doesnt have to be in the json output
        {"CHID":[1, 2, 3]}
    ]}
]}

*/