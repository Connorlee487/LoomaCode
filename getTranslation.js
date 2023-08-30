const axios = require("axios");

/* returned JSON looks like:
{
  "data": {
    "translations": [
      {
        "translatedText": "बच्चा"
      }
    ]
  }
}
 */
async function getTranslation(word){
    let apikey = ""; // from RAPIDapi.com 2022 09 07
    const res = await axios.get('https://www.googleapis.com/language/translate/v2?key=' + apikey + '&source=en&target=ne&q=' + word).then(result => {
        return result.data // Returns translation
    }).catch(error => {
        console.log('OUTPUT:  ' + "ERROR: translating " + word + ' :' + error)
    })
    return res.data.translations[0].translatedText // Returns translation
}; // end getTranslation()
async function main() {
    let word = "og";
    let result = await getTranslation(word);
    console.log('for ' + word + ' translation is ' + result.data.translations[0].translatedText);
};
main();
