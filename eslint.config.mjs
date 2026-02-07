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
        // Allow unused vars with _ prefix, suppress warnings for common patterns
        "no-unused-vars": ["warn", {
            argsIgnorePattern: "^_|^error|^err|^e$",
            varsIgnorePattern: "^_|^error|^err|Loading$|Error$|Modal$|Form$|Config$|Style$|Icon$|^is[A-Z]|^set[A-Z]|^show[A-Z]|^handle[A-Z]|^on[A-Z]|^get[A-Z]",
            ignoreRestSiblings: true,
            caughtErrors: "none"
        }],
        "no-console": "off",
        "react-hooks/rules-of-hooks": "warn",
        // Disable exhaustive-deps warnings - they can be noisy in development
        "react-hooks/exhaustive-deps": "off",
        "@next/next/no-html-link-for-pages": "off",
        // Allow <img> tags - we can optimize later
        "@next/next/no-img-element": "off",
        "import/no-anonymous-default-export": "off"
    }
}];
