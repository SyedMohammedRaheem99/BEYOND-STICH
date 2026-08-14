import fs from 'fs';
import path from 'path';

const CATALOG_BASE = 'C:\\Users\\starc\\Downloads\\catalogue-beyond-stich';

const result = {};

['men-ten-catalogue', 'game-catalogue', 'girls-catalogue'].forEach(folder => {
  const p = path.join(CATALOG_BASE, folder);
  if (!fs.existsSync(p)) return;
  result[folder] = fs.readdirSync(p).sort();
});

fs.writeFileSync('C:\\Users\\starc\\Downloads\\Beyond_stich\\beyond-stich-admin\\file_list.json', JSON.stringify(result, null, 2));
console.log('Saved file_list.json');
