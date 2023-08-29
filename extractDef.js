/*
LOOMA 
Filename: extractDef.js
Description: run by allBooks.sh
	reads file "unknownWords.json"
	calls dictionary API to get definition of each word
	calls translation API to get Nepali translation of each word
	writes a file "Words.json"
	output file format is a list of Looma Dictionary entries in mongodb format:
		{"en":"things","np":"चीजहरू","meanings":
		[{"part":"noun","def":"That which is considered to exist as a separate entity object quality or concept"},
		 {"part":"verb","def":"To express as a thing; to reify"},{"part":"noun","def":"One's clothes furniture luggage or possessions collectively; stuff"}],
		
		"ch_id":[{"EN":"1EN01.01"},{"CS":"10CS01.02"},{"ENa":"10EN02"},{"Ma":"10M13"},{"Sa":"10Sa03"},
		               {"SS":"4SS01.03"},{"M":"5M01"},{"SSa":"6SSa01.01"},{"V":"6V01.01"},{"H":"7H01.03"}]}

Programmer name: Connor L
Owner: Looma Education Company
Date: AUG 2022
Revision: 1.0
 */
var fs = require('fs')
const axios = require('axios')

async function getDef(word){ // Definition Function
    const res = await axios.get('https://api.dictionaryapi.dev/api/v2/entries/en/' + word).then(result => {

        return result.data[0] // Returns JSON of data

    }).catch(error => {

        console.log("ERROR DEF " + word)

    }) 

    return res // Returns JSON of data
}
async function getTranslation(word, key){ // Definition Function
    const res = await axios.get('https://www.googleapis.com/language/translate/v2?key=' + key + '&source=en&target=ne&q=' + word).then(result => {
        
        return result.data // Returns translation

    }).catch(error => {

        console.log("ERROR TRANSLATION " + word)

    })

    return res // Returns translation
}

async function main(){ // Main function
    
    var words, word, def = [], plural, root, translation // Declare variables
    var key = "" // Input google api key tutorial here: https://cloud.google.com/translate/docs/basic/translating-text

    const wordList = JSON.parse(fs.readFileSync("unknownWords.json")) // Reads JSON object of format
        /* 
        wordList Example
        {"entries" : [
            {"entry": [
                {"word" : Hello}
                {"ch_id" : [1EN01, 10Sa01]}
                {"uniqueBooks" : [EN, SA]}
            ]}
        ]}
        */

    for(each of wordList.entries){ // For every "entry"
        
        const currWord = each.entry[0].word
            
        words = await getDef(currWord) // Calls axios to retrieve definition in JSON format
        translator = await getTranslation(currWord, key) // Calls axios to retrieve translation in JSON format
        
        if(translator != undefined && translation.charCodeAt(0) > 122 && translation.charCodeAt(0) < 65){ // If the word has a translation
            // Checks if it is a correct translation 
                // Correct translation: ब्रेक 
                // Wrong translation: of

            translation = undefined
            translation = translator.data.translations[0].translatedText

        }else{
            translation = undefined // If not or error occured

        }
        
        if(words != undefined){ // If definition is available 
            word = words.word
            
            for(variation of words.meanings){ // For every meaning 
                                              // Example: Hello (noun) and Hello (verb)

                tempPos = variation.partOfSpeech.replace(/\.|\,|\!|\(|\)|\?/g, "")
                tempDef = variation.definitions[0].definition.replace(/\.|\,|\!|\(|\)|\?/g, "")
                
                def.push({"part": tempPos, "def": tempDef}) // Array of definitions 
            }
        }

        if(words != undefined && translation != undefined && def != []){ // If word definitions and translations are not undefined

            // Writes to words.json
            fs.appendFileSync("words.json", JSON.stringify({"en":currWord, "np":translation, "meanings":def, "ch_id": each.entry[1].CHID}) + "\n")

        }
	/* NOTE: should have an "else" statement here to write the non-words to a "non-words" file for manual checking
	*/
	
        def = [] // Reset defintion array for next word
    }
    

}

main() // Run

// After run in console
// mongoimport --db DB_NAME --collection DB_COLLECTION --file words.json