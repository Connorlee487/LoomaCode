/*
LOOMA 
Filename: readPdf2.mjs
Description: Run from chapGet.sh
	Converts PDF file from given directory into a text file
	Writes text output to scratch.txt

 */

import fs from "fs";
import PDFParser from "pdf2json";

const pdfParser = new PDFParser(this,1);

const dir = process.argv[2].toString() // Directory example: "/Users/connorlee/Dropbox/Dictionary/textbooks/Class2/English/English_2_9652.pdf"

pdfParser.on("pdfParser_dataError", errData => console.error(errData.parserError) );

pdfParser.on("pdfParser_dataReady", pdfData => {
    fs.writeFile("/Users/connorlee/Documents/loomaProgramsML/LoomaTextbookSearch/generateChapTxt/scratch.txt", pdfParser.getRawTextContent(), ()=>{console.log("Done.");});
});

pdfParser.loadPDF(dir);