#	Filename: singleBook.sh
#	Description: version of allBooks.sh for use with a single input file
#		see detailed description of allBooks.sh
#	Programmer name: Connor
#	Owner: Looma Education Company
#	Date: AUG 2022
#	Revision: 1.0
#
#	Details: 	works for .pdf or .txt files
#
# Enter filepath here
dir="/Users/connorlee/Dropbox/Dictionary/textbooks/Class2/English/English_2_9652.pdf" 

if [ "${dir: -4}" == ".pdf" ] # Checks if it is a pdf
then 
    node readPdf.js $dir "pdf" # Calls readPdf.js with directory and label of file extension 
    node textbookWords.js $dir # Calls textbookWords.js with folder name to retrieve CHID and get page numbers
else
    echo
fi

if [ "${dir: -4}" == ".txt" ] # Checks if it is a txt file
then 
    node readPdf.js $dir "txt"  # Calls readPdf.js with directory and label of file extension 
    node textbookWords.js $dir # Calls textbookWords.js with folder name to retrieve CHID and get page numbers
else
    echo
fi

