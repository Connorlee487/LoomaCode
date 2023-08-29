const fs = require("fs")
var loomaActivities = JSON.parse(fs.readFileSync('loomaActivities.json')) // Reads in JSON of all chapters

var allDN = "" // variable for display names
for( entry of loomaActivities){
    if(entry.dn !== undefined) allDN += entry.dn + "\n" // adding new line
}

fs.writeFileSync("activitesDN.txt", allDN); // writes text to new file