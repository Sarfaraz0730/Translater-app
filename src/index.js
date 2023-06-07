const fileSystem = require('fs');
const csvParser = require('csv-parser');
const pathUtil = require('path');

function loadData(file) {
  return new Promise((resolve, reject) => {
    const data = {};
    fileSystem.createReadStream(file)
      .pipe(csvParser())
      .on('data', (row) => {
        const key = row['Key'];
        const value = row['Value'];
        data[key] = value;
      })
      .on('end', () => {
        console.log("data : ", data)
        resolve((data)=>console.log("data",data));
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

function loadWords(file) {
  return new Promise((resolve, reject) => {
    fileSystem.readFile(file, 'utf-8', (error, data) => {
      if (error) {
        reject(error);
      } else {
        const words = data.split('\n').map((word) => word.trim());
        resolve(words);
      }
    });
  });
}

function replaceWordsInText(text, wordsToReplace, data) {
  const replacedWords = new Set();
  let replacedCount = 0;

  const words = text.split(/\b/);

  const replacedText = words
    .map((word) => {
      const cleanedWord = word.replace(/\W/g, '');

      if (wordsToReplace.includes(cleanedWord) && data.hasOwnProperty(cleanedWord)) {
        const replacement = data[cleanedWord];

        if (word[0] === word[0].toUpperCase()) {
          word = replacement.charAt(0).toUpperCase() + replacement.slice(1);
        } else if (word === word.toUpperCase()) {
          word = replacement.toUpperCase();
        } else {
          word = replacement;
        }

        replacedWords.add(cleanedWord);
        replacedCount++;
      }

      return word;
    })
    .join('');

  return {
    processedText: replacedText,
    replacedWords: replacedWords,
    replacedCount: replacedCount,
  };
}

const textFilePath = pathUtil.resolve(__dirname, '../t8.shakespeare.txt');
const wordsToReplaceFilePath = pathUtil.resolve(__dirname, '../find_words.txt')
const dataFilePath = pathUtil.resolve(__dirname, '../french_dictionary.csv')


const inputText = fileSystem.readFileSync(textFilePath, 'utf-8');
console.log("inputText : ",inputText )

Promise.all([loadWords(wordsToReplaceFilePath), loadData(dataFilePath)])
  .then(([wordsToReplace, data]) => {
    const startTime = new Date().getTime();
    const { processedText, replacedWords, replacedCount } = replaceWordsInText(
      inputText,
      wordsToReplace,
      data
    );
    const endTime = new Date().getTime();

    const outputFilePath = 'output.txt';
    fileSystem.writeFileSync(outputFilePath, processedText, 'utf-8');

    const uniqueReplacedWords = replacedWords.size;
    const processingTime = (endTime - startTime) / 1000;
    const memoryUsage = process.memoryUsage().heapUsed / (1024 * 1024);

    console.log('Unique words replaced:', uniqueReplacedWords);
    console.log('Total replacements:', replacedCount);
    console.log('Processing time:', processingTime, 'seconds');
    console.log('Memory usage:', memoryUsage.toFixed(2), 'MB');
  })
  .catch((error) => {
    console.error('An error occurred:', error);
  });
