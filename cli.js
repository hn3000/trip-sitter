const path = require('path');
const fs = require('fs');
const os = require('os');

function run(args) {

  switch (args[0]) {
    case 'convert':
      convertFiles(args.slice(1));
      break;
    default:
      console.log(
`usage: ${process.argv[0]} ${process.argv[1]} <cmd>
where <cmd> can be
convert <filename>|<folder> [<filename>]...
`)
  }

}

function convertFiles(filespecs) {
  filespecs.forEach(f => {
    if (fs.existsSync(f)) {
      const stats = fs.statSync(f);
      if (stats.isFile()) {
        convertSingleFile(f);
      }
    } 
  });
}

async function convertSingleFile(filename, openFolder) {
  const converter = require('./SR_to_AT/mainlogic');
  let cleanup = [];
  try {
    console.info(`converting ${filename}`);
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'trip-sitter')) + '/';
    cleanup.push(() => {fs.rmdirSync(tmpDir, { recursive: true, maxRetries: 2 })});
    const result = await converter.convertFile(filename, tmpDir);
    if (result.error) {
      console.warn(`conversion failed: ${filename}: ${result.message}  ${result.error}`);
    } else {
      console.info(`success: ${result.data.metadata.title} by ${result.data.metadata.authorID_SR}`);
      var mapper = result.data.metadata.authorID_SR;
      var title = result.data.metadata.title;
      
      // result is ats json
      fs.writeFileSync(tmpDir + result.data.metadata.songFilename.replace(mapper + "_", "").replace(".ogg", ".ats"), JSON.stringify(result.data, null, 2))

      const outputDir = `./converted/${mapper}_${title}/`;
      fs.mkdirSync(outputDir, { recursive: true });

      // deploy ats and ogg
      await converter.deployToGame(tmpDir, outputDir, outputDir, mapper, openFolder);
      console.log(`converted ${filename}`);
    }
  } finally {
    cleanup.forEach(cc => cc());
  }

}

run(process.argv.slice(2));