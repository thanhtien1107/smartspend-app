const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * @interface RequestUtils
 */

/**
 * Checks if a key is configured (not empty and not the placeholder)
 * @param {string} value 
 * @param {string} placeholder 
 * @returns {boolean}
 */
function hasConfiguredKey(value, placeholder) {
  return Boolean(value && value.trim() && value.trim() !== placeholder);
}

/**
 * Checks if request is multipart/form-data
 * @param {import('express').Request} req 
 * @returns {boolean}
 */
function isMultipartRequest(req) {
  return /^multipart\/form-data/i.test(req.headers['content-type'] || '');
}

function getMultipartBoundary(req) {
  const match = String(req.headers['content-type'] || '').match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  return match ? match[1] || match[2] : '';
}

function parseContentDisposition(value = '') {
  return value.split(';').reduce((result, part) => {
    const [rawKey, ...rawValue] = part.trim().split('=');
    if (!rawKey || !rawValue.length) return result;
    result[rawKey] = rawValue.join('=').replace(/^"|"$/g, '');
    return result;
  }, {});
}

/**
 * Parses multipart form data
 * @param {import('express').Request} req 
 * @param {string} uploadDir 
 * @returns {Promise<{fields: Object, files: Object}>}
 */
function parseMultipartForm(req, uploadDir) {
  return new Promise((resolve, reject) => {
    const boundary = getMultipartBoundary(req);
    if (!boundary) {
      resolve({ fields: {}, files: {} });
      return;
    }

    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('error', reject);
    req.on('end', () => {
      const fields = {};
      const files = {};
      const rawBody = Buffer.concat(chunks).toString('binary');
      const parts = rawBody.split(`--${boundary}`).slice(1, -1);
      
      if (uploadDir) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      parts.forEach((part) => {
        const normalizedPart = part.replace(/^\r\n/, '').replace(/\r\n$/, '');
        const separatorIndex = normalizedPart.indexOf('\r\n\r\n');
        if (separatorIndex === -1) return;

        const rawHeaders = normalizedPart.slice(0, separatorIndex);
        const rawContent = normalizedPart.slice(separatorIndex + 4).replace(/\r\n$/, '');
        const headers = rawHeaders.split('\r\n').reduce((result, line) => {
          const [rawKey, ...rawValue] = line.split(':');
          if (!rawKey || !rawValue.length) return result;
          result[rawKey.trim().toLowerCase()] = rawValue.join(':').trim();
          return result;
        }, {});
        const disposition = parseContentDisposition(headers['content-disposition']);
        const fieldName = disposition.name;
        if (!fieldName) return;

        if (disposition.filename && uploadDir) {
          if (!headers['content-type']?.startsWith('image/')) return;
          const extension = path.extname(disposition.filename).replace(/[^.\w-]/g, '') || '.jpg';
          const fileName = `${uuidv4()}${extension}`;
          const filePath = path.join(uploadDir, fileName);
          fs.writeFileSync(filePath, Buffer.from(rawContent, 'binary'));
          files[fieldName] = {
            originalName: disposition.filename,
            fileName,
            contentType: headers['content-type'],
            url: `/uploads/expenses/${fileName}`
          };
          return;
        }

        fields[fieldName] = Buffer.from(rawContent, 'binary').toString('utf8');
      });

      resolve({ fields, files });
    });
  });
}

module.exports = {
  hasConfiguredKey,
  isMultipartRequest,
  parseMultipartForm
};
