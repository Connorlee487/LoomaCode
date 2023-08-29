const fs = require('fs')
const { ServerApiVersion } = require('mongodb')
const path = require('path')

/**
 * Calculates Inverse Document Frequency value of each query and writes it to a corresponding array IDF 
 * @param {*} IDF Array which stores the Inverse Document Frequency value of each query (Ex: [1, 2] would be the IDF values for search query "Big Tree")
 * @param {*} numShows Array which represents the number of documents/display names from Looma Activities which contain the search query (Ex: [20, 2, 0] would, respectivley, be the number of times "Big Tree Cat" appears in Display Names of Looma Activities)
 * @param {*} numDocs Integer which represents the total number of documents/display names from Looma Activities
 */
function idf(IDF, numShows, numDocs){

    for(let query = 0; query < numShows.length; query++){ // Iterates through length of numShows 

        IDF[query] = Math.log( 1 + ( (numDocs - numShows[query] + 0.5) / ( numShows[query] + 0.5 ) ) ) // Formula for calculating IDF of a single quer

    }

}

/**
 * Returns the total relevancy value of a single search query 
 * @param {*} docLen Integer value representing the current length of the document passed in (Ex: Assuming document passed is "Book of apples" docLen = 14)
 * @param {*} avgDocLen Integer value representing the average length of all the documents/display names from Looma Activities
 * @param {*} IDF Array of IDF values corresponding to search query via index 
 * @param {*} numDocShow Integer value representing the total # of times the query has appeared in the document passed (Ex: Assuming document passed is "Book of apples" query = "o", numDocShow = 2)
 * @param {*} index Integer value representing the index pointing toward the current search query
 * @returns 
 */
function bm(docLen, avgDocLen, IDF, numDocShow, index){
    const K1 = 1.5 // Constant for calculating relevancy 
    const b = 0.5 // Constant for calculating relevancy 

    return IDF[index] * ( (numDocShow * (K1 + 1) ) / ( numDocShow + K1 * ( 1 - b + b * ( docLen / avgDocLen ) ) ) ) // Formula for calculating relevancy 
}

// Search query goes here V
const queries = `

buisness job trade money interview
`.replace(/[.,!$;:`\n]/g," ").replace(/\s+/g, " ").trim().toLowerCase().split(" ") // Tokenizes the input query

var chapterText = [], avgDocLen = 0, numDocs, bmValues = []
const dir = fs.readdirSync("/Users/connorlee/Documents/loomaProgramsML/ChapterSummary"), IDF = [], numShows = []


dir.forEach(file => 
    chapterText.push([fs.readFileSync("./ChapterSummary/" + file).toString(), file, fs.readFileSync("./ChapterSummary/" + file).toString().split(" ").length])
) // Inputs [string of chapter text, chapter name, size of chapter]

for (let x = 0; x < queries.length; x++){  // Creates temporary values depending on how many queries there are 
    numShows.push(0)
    IDF.push(0)
}

numDocs = chapterText.length

for(chapter of chapterText){

    for(let query = 0; query < queries.length; query++){

        var searchQueryRegex = new RegExp( queries[query] ,"i") // Regex of current query
        if(chapter[0].match(searchQueryRegex) != null){ numShows[query]+=1 } // Increments numShows as long as there is a single match within current entry.dn 

    }
    avgDocLen += chapter[2]

}

idf(IDF, numShows, numDocs)

avgDocLen /= numDocs

for(chapter of chapterText){

    var sumQueryValues = 0

    for(let query = 0; query < queries.length; query++){
        
        var searchQueryRegex = new RegExp( queries[query] ,"gmi") // New regex for query 
        var numDocShow = 0 // Integer representing the total # of times the query shows in the current document  

        if(chapter[0].match(searchQueryRegex) != null){ numDocShow = Array.from(chapter[0].matchAll(searchQueryRegex)).length } // If query exists in document, record the # of appearances

        sumQueryValues += bm(chapter[0].split(" ").length, avgDocLen, IDF, numDocShow, query) // Gets relevancy score of current query and adds it to sumQueryValues

    }

    bmValues.push({dn: chapter[1], value: sumQueryValues}) // Writes to list of Objects in format of {dn (display name), value (calculated relevancy score)}

}



console.log(queries, avgDocLen / numDocs, numDocs, numShows, IDF)
// const word = token.replace(/[.,!$;:`]/g," ").toLowerCase().trim() // Cleans up the word

bmValues.sort((a, b) => b.value - a.value) // Arrow functon to sort in descending 
console.log(bmValues.slice(0,10)) // Gets top 10 results of list of Objects
