/*
LOOMA 
Filename: chapterSummary.js
Description: run by chapGet.sh
	Takes in directory of the current textbook
    Takes in pdf of the book from Scratch.txt
    Generates the title through regex 
    Uses Looma database of chapter page breaks to section off the textbook
    Outputs txt file of chapter to current directory 

 */
const fs = require("fs")
const regexClass = /Class.+/gm; // Matches everything after Class-> 
const regexGrade = /\d+/gm;; // Matches any digit, or the Grade level 
const nepaliBook = /Nepali/gm;
var subject = "";
var grade = "";

var chapterLooma = JSON.parse(fs.readFileSync('loomaChapters.json')) // Reads in JSON of all chapters
var bookText = fs.readFileSync("scratch.txt").toString() // Reads in the pdf scanned version of book

const words = process.argv[2] // Takes in directory ex: /Users/connorlee/Dropbox/Dictionary/textbooks/Class9/Math
if(words.match(nepaliBook[0]) === undefined){

    subject = words.match(regexClass)[0].split("/")[1] // Matches which subject it is

    grade = parseInt(words.match(regexGrade)[0]) // Matches which grade 

    var match = "-1"; // Hardcode matches
    if(subject == "Math"){
        match = grade + "M"
    }
    if(subject == "Vocation"){
        match = grade + "V"
    }
    if(subject == "English"){
        match = grade + "EN"
    }
    if(subject == "Science"){
        match = grade + "S"
    }
    if(subject == "SocialStudies"){
        match = grade + "SS"
    }
    if(subject == "Health"){
        match = grade + "H"
    }
    if(subject == "Computer"){
        match = grade + "CS"
    }
    if(subject == "Serofero"){
        match = grade + "SF"
    }

    for(entry of chapterLooma){
        const regex = new RegExp(match, "gm"); // Matches used for matching with looma chapter database ex: 8S -> 8S02
        const chapNum = /\d+/gm; // Matches any digit for chapter number


        if(typeof entry._id == "string") if((entry._id).match(regex) != null) if(entry.pn !== undefined) if(entry.len !== undefined){ // if basic requirements and data are met

            /*
            Regex to match page number
            Page number format from text document: ----------------Page (1) Break----------------
            1 part of regex: "-*Page \\(("
                Matches the hyphens, word Page, and first open parentheses "----------------Page ("
            2 part of regex: (parseInt(entry.pn) - 2)
                Matches the page number, -2 because looma database chap number did accound for coverpage and beginning pages
            3 part of regex: "\\))"
                Matches the closed parentheses ")"
            4 part of reges: "[^]+"
                Matches everything after to capture entire text
            */
            const pageRegexStart = new RegExp("-*Page \\(("+ (parseInt(entry.pn) - 2) + "\\))" + "[^]+", "gm") 
            
            console.log(entry._id + " " + entry._id.match(chapNum)[1] + "  " + entry.pn + " " + entry.len);
            
            const chapText = bookText.match(pageRegexStart)[0] // Matches with the scanned text
            const croppedChapText = chapText.substring(0, chapText.indexOf("Page (" + (parseInt(entry.pn) + parseInt(entry.len) - 2) + ")")) // Finds the index of the last page of the chapter (faster than using regex because regex requires backtracking)
            fs.writeFileSync(entry._id + ".txt", croppedChapText) // Writes text to file with the title name of chapter ID

        }   
    }
}