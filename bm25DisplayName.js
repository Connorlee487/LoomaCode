const fs = require("fs")


/**
 * Calculates Inverse Document Frequency value of each query and writes it to a corresponding array IDF 
 * @param {*} IDF Array which stores the Inverse Document Frequency value of each query (Ex: [1, 2] would be the IDF values for search query "Big Tree")
 * @param {*} numShows Array which represents the number of documents/display names from Looma Activities which contain the search query (Ex: [20, 2, 0] would, respectivley, be the number of times "Big Tree Cat" appears in Display Names of Looma Activities)
 * @param {*} numDocs Integer which represents the total number of documents/display names from Looma Activities
 */
function idf(IDF, numShows, numDocs){

    for(let query = 0; query < numShows.length; query++){ // Iterates through length of numShows 

        IDF[query] = Math.log( 1 + ( (numDocs - numShows[query] + 0.5) / ( numShows[query] + 0.5 ) ) ) // Formula for calculating IDF of a single query

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
    const K1 = 1.2 // Constant for calculating relevancy 
    const b = 0.75 // Constant for calculating relevancy 

    return IDF[index] * ( (numDocShow * (K1 + 1) ) / ( numDocShow + K1 * ( 1 - b + b * ( docLen / avgDocLen ) ) ) ) // Formula for calculating relevancy 

}



input = "math".split(" ") //process.argv[2] 
var loomaActivities = JSON.parse(fs.readFileSync('loomaActivities.json'))

/**
 * @param avgDocLen Integer representing the average length of documents/display names from Looma Activities
 * @param numDocs Integer representing total # of documents
 * @param numShows Array which represents the number of documents/display names from Looma Activities which contain the search query (Ex: [20, 2, 0] would, respectivley, be the number of times "Big Tree Cat" appears in Display Names of Looma Activities)
 * @param IDF Array which stores the Inverse Document Frequency value of each query (Ex: [1, 2] would be the IDF values for search query "Big Tree")
 * @param bmValues Array of objects which store the {dn (display name), value (calculated relevancy score)}
 */
var avgDocLen = 0, numDocs = 0, numShows = [], IDF = [], bmValues = []

for (let x = 0; x < input.length; x++){  // Creates temporary values depending on how many queries there are 
    numShows.push(0)
    IDF.push(0)
}

for (entry of loomaActivities){ // For each JSON object
    if(entry.dn != undefined){ // If entry has a display name 
        for(let query = 0; query < input.length; query++){ // For each query that is searched
            var searchQueryRegex = new RegExp( input[query] ,"i") // Regex of current query
            if(entry.dn.match(searchQueryRegex) != null){ numShows[query]+=1 } // Increments numShows as long as there is a single match within current entry.dn 
        }
        avgDocLen += entry.dn.split(" ").length // Adds document length
        numDocs++ // Increments # of documents 
    }
}

idf(IDF, numShows, numDocs) // Gets the Inverse Document Frequency values and writes them to IDF

avgDocLen /= numDocs // Gets average length of each document


for(entry of loomaActivities){ // For each JSON object

    if(entry.dn != undefined){ // If entry has a display name
        var sumQueryValues = 0 // Variable used to store the sum of the relevancy values of each query 

        for(let query = 0; query < input.length; query++){ // For each query that is searched

            var searchQueryRegex = new RegExp( input[query] ,"gmi") // New regex for query 
            var numDocShow = 0 // Integer representing the total # of times the query shows in the current document  

            if(entry.dn.match(searchQueryRegex) != null){ numDocShow = Array.from(entry.dn.matchAll(searchQueryRegex)).length } // If query exists in document, record the # of appearances

            sumQueryValues += bm(entry.dn.split(" ").length, avgDocLen, IDF, numDocShow, query) // Gets relevancy score of current query and adds it to sumQueryValues

        }
    
        bmValues.push({dn: entry.dn, value: sumQueryValues}) // Writes to list of Objects in format of {dn (display name), value (calculated relevancy score)}
    }

}

bmValues.sort((a, b) => b.value - a.value) // Arrow functon to sort in descending 
console.log(bmValues.slice(0,10)) // Gets top 10 results of list of Objects


// Combine display name and chapter search
// Input query phrase + number(for how many top searches)
// {query: string, account: Integer}

// POST req from javascript front
