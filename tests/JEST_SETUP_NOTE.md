Bu projede su an Jest kurulumu yok (`package.json` icinde `test` scripti bulunmuyor).

Minimal kurulum adimlari:

1. `npm i -D jest ts-jest @types/jest`
2. `npx ts-jest config:init`
3. `package.json` icine script ekle:
   - `"test": "jest"`
4. `tsconfig` path alias (`@/`) kullandigi icin `jest.config` icine `moduleNameMapper` tanimla.
