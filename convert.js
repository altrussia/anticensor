import * as dictionaries from './subreddits/index.js';

let letters = {
  "a": "а",
  "b": "ḅ",
  "c": "с",
  "d": "ḍ",
  "e": "ḛ",
  "f": "ḟ",
  "g": "ģ",
  "h": "ĥ",
  "i": "і",
  "j": "ј",
  "k": "к",
  "l": "ĺ",
  "m": "м",
  "n": "ń",
  "o": "ó",
  "p": "ṗ",
  "q": "",
  "r": "ṙ",
  "s": "ѕ",
  "t": "ƭ",
  "u": "ṷ",
  "v": "ṿ",
  "w": "ẉ",
  "x": "ẋ",
  "y": "ẏ",
  "z": "ƶ",
  "0": "０",
  "1": "１",
  "2": "２",
  "3": "３",
  "4": "４",
  "5": "５",
  "6": "６",
  "7": "７",
  "8": "８",
  "9": "９",
  "-": "𝍠"
}


function* enumerate(iter) {
  let index = 0
  for (let value of iter) {
    yield [index, value]
    index += 1
  }
}


function make_dictionary(dictionary, replacement) {
  let words = {}

  for (let word of dictionary) {
    let first_letter = word[0]  
    let replacement_word = replacement[first_letter] + word.slice(1)
    words[word] = replacement_word
  }

  return words
}


function get_replacement_word(text, word, replacement) {
  let replacement_word = []

  for (let [idx, value] of enumerate(text)) {
    let letter = replacement[idx]
    if (value == word[idx]) {
      replacement_word.push(letter)
    } else {
      replacement_word.push(letter.toUpperCase())
    }
  }

  return replacement_word.join("")
}

export function get_dictionnary(dict) {
  return dictionaries[dict] || []
}


export function convert(text, dictionary, bold_censor=true) {
  dictionary.sort()
  dictionary.reverse()
  
  let full_dictionary = make_dictionary(dictionary, letters)

  for (let [word, replacement] of Object.entries(full_dictionary)) {
    let regex = new RegExp(word, "i")
    while (text.search(regex) >= 0) {
      let index = text.search(regex) 
      let last_index = index + word.length
      let found_word = text.slice(index, last_index)

      let replacement_word = get_replacement_word(
        found_word,
        word,
        replacement
      )

      let text_start = text.slice(0, index)
      let text_end = text.slice(last_index)

      if (bold_censor) {
      	replacement_word = "**" + replacement_word + "**"
      }

      text = text_start + replacement_word + text_end
    }
  }

  return text
}

export function get_dictionaries() {
  return Object.keys(dictionaries)
}
