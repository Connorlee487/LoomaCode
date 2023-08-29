:'
LOOMA 
Filename: chapGet.sh
Description: run by user (1 time)
	Loops through directory of Looma textbooks 
    Calls readPdf.js to get pdf -> text
    Calls chapterSummary.js with path of current textbook 
'
dir=/Users/connorlee/Dropbox/Dictionary/textbooks\*

for file in $dir 	# Goes into textbooks
do
    for topic in $file/* # Goes into classes
    do
        for books in $topic/* # Goes into the subjects
        do
            for book in $books/* # Goes into files within the subjects
            do
                if [ "${book: -4}" == ".pdf" ] # Makes sure it is a pdf 
                then
                    node /Users/connorlee/Dropbox/Dictionary/Looma\ Dictionary2022/ConnorsPrograms/readPdf.js $book # gets the pdf scanned version 
                    wait
                    node chapterSummary.js $books # runs script to extract chapter content 
                fi
            done
        done
    done
done

# words.matchAll(regex)
# const regex = /Class.*/gm; 