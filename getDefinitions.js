/*
LOOMA
Filename: getDefinitions.js
Description: n ode.js program to get definitions for word from dictionary.api
Owner: Looma Education Company
Date: AUG 2022
Revision: 1.0
 */
const axios = require('axios')

async function getDef(word){ // Definition Function
    const res = await axios.get('https://api.dictionaryapi.dev/api/v2/entries/en/' + word).then(result => {
        return result.data[0] // Returns JSON of data
    }).catch(error => { console.log("ERROR DEF " + word) });
    return res // Returns JSON of data
}

async function main() { // Main function
    let word, definitions, def, pos;
    let results = [];

    word = "og";
    
    definitions = await axios.get('https://api.dictionaryapi.dev/api/v2/entries/en/' + word).then(result => {
        return result.data[0] // Returns JSON of data
    }).catch(error => { console.log("ERROR DEF " + word) });
    
  //  definitions = await getDef(word) // Calls axios to retrieve definition in JSON format
    for (variation of definitions.meanings) { // For every meaning
        
        //console.log(variation.partOfSpeech);
        //console.log(variation.definitions[0]);
        
        pos = variation.partOfSpeech.replace(/\.|\,|\!|\(|\)|\?/g, "");
        def = variation.definitions[0].definition.replace(/\.|\,|\!|\(|\)|\?/g, "");
        results.push( {'pos': pos, 'def': def} );
    };
 
    console.log('for word ' + word + ':');
    for (let i=0;i<results.length;i++) {
        console.log('    ('+ results[i].pos + ') ' + results[i].def);
    };
  
    return results;
};

main();
