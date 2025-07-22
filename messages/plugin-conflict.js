"use strict";

module.exports = function (it) {
	const { pluginId, plugins } = it;

	let result = `
❗ ESLint couldn't determine the plugin "${pluginId}" uniquely.
Multiple versions or instances of the plugin were found:
`;

	for (const { filePath, importerName } of plugins) {
		result += `\n  • ${filePath}  📦 (loaded in: "${importerName}")`;
	}

	result += `

🧹 To resolve this issue:
→ Remove the "plugins" setting from one of the configs
→ Or uninstall one of the duplicate plugin installations

🔍 Still stuck? Check the ESLint troubleshooting guide:
https://eslint.org/docs/latest/use/troubleshooting
`;

	return result.trimStart();
};
