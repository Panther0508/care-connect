import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://huggingface.co/Xenova';
const MODELS_DIR = path.join(__dirname, '..', 'public', 'models', 'Xenova');

const models = {
  'TinyLlama-1.1B-Chat-v1.0': {
    files: ['config.json', 'tokenizer_config.json', 'tokenizer.json', 'special_tokens_map.json', 'generation_config.json', 'quantize_config.json'],
    onnxFile: 'model_quantized.onnx',
    hasOnnx: true
  },
  'all-MiniLM-L6-v2': {
    files: ['config.json', 'tokenizer_config.json', 'tokenizer.json', 'special_tokens_map.json'],
    onnxFile: 'model_quantized.onnx',
    hasOnnx: true
  },
  'whisper-tiny': {
    files: ['config.json', 'tokenizer.json', 'preprocessor_config.json'],
    onnxFile: 'model.onnx',
    hasOnnx: true
  },
  'clip-vit-base-patch32': {
    files: ['config.json', 'tokenizer.json', 'preprocessor_config.json'],
    onnxFile: 'model.onnx',
    hasOnnx: true
  },
  'nllb-200-distilled-600M': {
    files: ['config.json', 'tokenizer.json', 'tokenizer_config.json'],
    onnxFile: 'model.onnx',
    hasOnnx: true
  }
};

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    console.log(`Downloading: ${url}`);
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      if (response.statusCode === 404) {
        file.close();
        fs.unlinkSync(destPath);
        reject(new Error(`404 Not Found: ${url}`));
        return;
      }
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(destPath);
        reject(new Error(`HTTP ${response.statusCode}: ${url}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        const stats = fs.statSync(destPath);
        console.log(`Saved: ${destPath} (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      fs.unlinkSync(destPath);
      reject(err);
    });
  });
}

async function downloadModel(modelName, config) {
  const modelDir = path.join(MODELS_DIR, modelName);
  const onnxDir = path.join(modelDir, 'onnx');

  console.log(`\n=== Processing ${modelName} ===`);

  ensureDir(modelDir);
  ensureDir(onnxDir);

  for (const file of config.files) {
    const destPath = path.join(modelDir, file);
    if (fs.existsSync(destPath)) {
      console.log(`Exists: ${file}`);
      continue;
    }
    const url = `${BASE_URL}/${modelName}/resolve/main/${file}`;
    try {
      await downloadFile(url, destPath);
    } catch (err) {
      console.warn(`Warning: Could not download ${file}: ${err.message}`);
    }
  }

  if (config.hasOnnx) {
    const destOnnx = path.join(onnxDir, config.onnxFile);
    const existingOnnx = fs.readdirSync(onnxDir).find(f => f.endsWith('.onnx'));
    if (existingOnnx) {
      const existingPath = path.join(onnxDir, existingOnnx);
      if (existingOnnx !== config.onnxFile) {
        console.log(`Renaming ${existingOnnx} -> ${config.onnxFile}`);
        fs.renameSync(existingPath, destOnnx);
      } else {
        console.log(`Exists: onnx/${config.onnxFile}`);
      }
    } else {
      let onnxUrl;
      if (modelName === 'TinyLlama-1.1B-Chat-v1.0' || modelName === 'all-MiniLM-L6-v2') {
        onnxUrl = `${BASE_URL}/${modelName}/resolve/main/onnx/model_quantized.onnx`;
      } else {
        onnxUrl = `${BASE_URL}/${modelName}/resolve/main/onnx/model.onnx`;
      }

      try {
        await downloadFile(onnxUrl, destOnnx);
      } catch (err) {
        console.error(`Failed to download ONNX for ${modelName}: ${err.message}`);
      }
    }
  }
}

async function main() {
  console.log('Starting model file verification and download...\n');
  console.log(`Models directory: ${MODELS_DIR}\n`);

  for (const [modelName, config] of Object.entries(models)) {
    try {
      await downloadModel(modelName, config);
    } catch (err) {
      console.error(`Error processing ${modelName}: ${err.message}`);
    }
  }

  console.log('\n=== Verification ===');
  for (const [modelName, config] of Object.entries(models)) {
    const modelDir = path.join(MODELS_DIR, modelName);
    const onnxDir = path.join(modelDir, 'onnx');
    const onnxPath = path.join(onnxDir, config.onnxFile);

    const hasConfigs = config.files.some(f => fs.existsSync(path.join(modelDir, f)));
    const hasOnnx = fs.existsSync(onnxPath);

    const status = hasConfigs && hasOnnx ? '✅' : '❌';
    console.log(`${status} ${modelName}: configs=${hasConfigs ? 'ok' : 'missing'}, onnx=${hasOnnx ? 'ok' : 'missing'}`);
  }

  console.log('\nDone.');
}

await main();
