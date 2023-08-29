#	Filename: allBooks.sh
#	Description: master shell script for extracting words from textbooks for Looma Dictionary

#	Programmer name: Connor
#	Owner: Looma Education Company
#	Date: AUG 2022
#	Revision: 1.0
#
#	Details: 	works for .pdf or .txt files
#		assumes .../grade/subject/books directory structure used by Looma

#    change the next line for correct directory
dir=/Users/connorlee/Dropbox/Dictionary/textbooks/*

for file in $dir 	# Loops through all the levels ex: Class1, Class2, etc.
do

    for topic in $file/* 	# Loops through the topic ex: English, Math, etc.
    do

        for books in $topic/* # Loops through the documents in the topic folders ex: .pdf, .png, etc.
        do

            if [ "${books: -4}" == ".pdf" ] # Checks if it is a pdf
            then 
                node readPdf.js $books "pdf" # Calls readPdf.js with directory and label of file extension
		# readPDF.js reads a file (pdf or txt) and outputs a plain text version of the file to bookPDF.txt
                node textbookWords.js $books # Calls textbookWords.js with folder name to retrieve CHID and get page numbers
		# textbookWords.js reads bookPDf.txt, determines the ch_id and page of each word, and writes file unknownWords.json
		#format of unknownWords.json: an array with each word, its ch_ids by subject and list of subjects it appears in
		# {"word":"break"},
		# {"CHID":[{"EN":"1EN01.01"},{"CS":"10CS01.01"},{"ENa":"10EN01"},{"Ma":"10Ma01.01"},
		#   {"Sa":"10Sa01"},{"M":"4M01.01"},{"SS":"4SS01.03"},{"SSa":"6SSa01.00"},{"V":"6V01.01"},{"H":"7H01.01"}]},
		# {"uniqueBooks":"[\"EN\",\"CS\",\"ENa\",\"Ma\",\"Sa\",\"M\",\"SS\",\"SSa\",\"V\",\"H\"]"}]}
            else
                echo
            fi
    
            if [ "${books: -4}" == ".txt" ] # Checks if it is a txt file
            then 
                node readPdf.js $books "txt"  # Calls readPdf.js with directory and label of file extension 
                node textbookWords.js $books # Calls textbookWords.js with folder name to retrieve CHID and get page numbers
            else
                echo
            fi

        done
    done
done

node extractDef.js # Calls extractDef 
	#reads file "unknownWords.json"
	#calls dictionary API to get definition of each word
	#calls translation API to get Nepali translation of each word
	#writes a file "Words.json"
	
# uncomment next line to write the words into mongoDB
# mongoimport --db looma --collection dictionaryv2 --file words.json