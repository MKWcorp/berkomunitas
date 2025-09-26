import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [...compat.extends("next/core-web-vitals"), {
    files: ["**/*.{js,jsx,ts,tsx}"],
    ignores: [
        "**/*backup*.js",
        "**/page-backup.js", 
        "**/figma-design*.js",
        "**/SocialMediaTab-backup.js"
    ],
    rules: {
        "react/no-unescaped-entities": "off",
        "@next/next/no-page-custom-font": "off",
        "react/react-in-jsx-scope": "off",
        "react/prop-types": "off",
        "no-unused-vars": ["warn", {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_"
        }],
        "no-console": "off",
        "react-hooks/rules-of-hooks": "warn",
        "react-hooks/exhaustive-deps": "warn",
        "@next/next/no-html-link-for-pages": "warn",
        "@next/next/no-img-element": "warn",
        "import/no-anonymous-default-export": "warn"
    }
}];
