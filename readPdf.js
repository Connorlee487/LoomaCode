/*
LOOMA 
Filename: readPDF.js
Description: run by allBooks.sh
	parses a PDF (or TXT) file
	writes a file "bookPDF.txt" containing all the text from the PDF

Programmer name: Connor
Owner: Looma Education Company
Date: AUG 2022
Revision: 1.0
 */
PDFParser = require("pdf2json")
const fs = require("fs")
var pdfParser = new PDFParser(this,1) // New pdf parser 

pdfParser.on("pdfParser_dataReady", pdfData => { // Calls pdf parser and reads pdf
    fs.writeFile("/Users/connorlee/Documents/loomaProgramsML/LoomaTextbookSearch/generateChapTxt/scratch.txt", pdfParser.getRawTextContent(), ()=>{}) // Writes output to txt file bookPDF.txt
})
 
const dir = process.argv[2] // Directory example: "/Users/connorlee/Dropbox/Dictionary/textbooks/Class2/English/English_2_9652.pdf"
const typeFile = "pdf" // Type of file example: "pdf" or "txt"

if( typeFile === "pdf"){ // If pdf then use PDF parser 
    pdfParser.loadPDF(dir)
}
if( typeFile === "txt"){ // If txt then write to file
    fs.writeFileSync("/Users/connorlee/Documents/loomaProgramsML/LoomaTextbookSearch/generateChapTxt/scratch.txt", fs.readFileSync(dir))
}