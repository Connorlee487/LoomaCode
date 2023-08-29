/*
LOOMA 
Filename: app.js
Description: run from terminal/console
	renders index.html
	intercepts http POST request and generates top searches using BM25 search algorithm

 */
function clean(search){
  return search.replace(/[.,!$;:`\n]/g," ").replace(/\s+/g, " ").trim().toLowerCase().split(" ") // Tokenizes the input query
}

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


function mainBM(dir, chapterText, avgDocLen, numDocs, bmValues, IDF, numShows, queries){

  const dirPath = "./ChapterSummary/" // Change directory to where the folder ChapterSummary is (folder which holds all the text files)

  dir = fs.readdirSync(dirPath) // Sets and reads current path 
  IDF = [], numShows = [] 

  dir.forEach(file => 
    chapterText.push([fs.readFileSync(dirPath + file).toString(), file, fs.readFileSync(dirPath + file).toString().split(" ").length]) 
  ) // Inputs [string of chapter text, chapter name, size of chapter]

}


const { channel } = require('diagnostics_channel')
const express = require('express');
const app = express();
const fs = require('fs')
const path = require('path')
const url = '/http://10.159.26.69:2000/' // Put ip:2000 
 
app.use(express.json());


app.get('/', (req, res) => { // Renders the html page
  res.sendFile(__dirname + '/index.html');
});

app.post(url, (req, res) => { // Takes the POST data from the server and handles it within
  const { search, length } = req.body; // Takes the search query and # of top searches

  const queries = clean(req.body.search) // Cleans up the user input

  // chapterText: stores [string of chapter text, chapter name, size of chapter] 
  // avgDocLen: numerical average of the length of each document
  // numDocs: total number of documents
  // bmValues: stores the [chapter, relevancy score]
  // IDF: Stores the inverse document frequency 
  // numShows: Stores how many documents contain the search query 
  var chapterText = [], avgDocLen = 0, numDocs, bmValues = [], dir, IDF = [], numShows = []; 

  mainBM(dir, chapterText, avgDocLen, numDocs, bmValues, IDF, numShows, queries) // Function for reading thorugh the text files

  for (let x = 0; x < queries.length; x++){  // Creates temporary values depending on how many queries there are 
    numShows.push(0)
    IDF.push(0)
  }

  numDocs = chapterText.length // Sets # of total documents

  for(chapter of chapterText){

    for(let query = 0; query < queries.length; query++){

        var searchQueryRegex = new RegExp( queries[query] ,"i") // Regex of current query
        if(chapter[0].match(searchQueryRegex) != null){ numShows[query]+=1 } // Increments numShows as long as there is a single match within current entry.dn 

    }
    avgDocLen += chapter[2] // Adds the length of the chapter 
  }

  idf(IDF, numShows, numDocs) // Gets Inverse Document Frequency

  avgDocLen /= numDocs // Calculates the average 

  for(chapter of chapterText){

    var sumQueryValues = 0 // Variable for keeping track of the relevancy scores

    for(let query = 0; query < queries.length; query++){
        
        var searchQueryRegex = new RegExp( queries[query] ,"gmi") // New regex for query 
        var numDocShow = 0 // Integer representing the total # of times the query shows in the current document  

        if(chapter[0].match(searchQueryRegex) != null){ numDocShow = Array.from(chapter[0].matchAll(searchQueryRegex)).length } // If query exists in document, record the # of appearances

        sumQueryValues += bm(chapter[0].split(" ").length, avgDocLen, IDF, numDocShow, query) // Gets relevancy score of current query and adds it to sumQueryValues

    }

    bmValues.push({dn: chapter[1], value: sumQueryValues}) // Writes to list of Objects in format of {dn (display name), value (calculated relevancy score)}

  }

  bmValues.sort((a, b) => b.value - a.value) // Arrow functon to sort in descending 

  var topLength = 10;
  if(Number.isInteger(parseInt(req.body.length))){ // Checks if it is an Integer
    topLength = parseInt(req.body.length)
  }

  console.log(bmValues.slice(0, topLength)) // Gets top 10 results of list of Objects

  const dataBM = bmValues.slice(0, topLength) // Gets the top # of searches based on user input

  res.send({ // Sends data back to the server
    search,
    length,
    dataBM,
  });

});

app.listen(2000, '0.0.0.0',() => { // Appears on port 2000

});