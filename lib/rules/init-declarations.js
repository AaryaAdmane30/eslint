/**
 * @fileoverview A rule to control the style of variable initializations.
 * @author Colin Ihrig
 */

"use strict";

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const CONSTANT_BINDINGS = new Set(["const", "using", "await using"]);

/**
 * Checks whether or not a given node is a for loop.
 * @param {ASTNode} block A node to check.
 * @returns {boolean} `true` when the node is a for loop.
 */
function isForLoop(block) {
	return (
		block.type === "ForInStatement" ||
		block.type === "ForOfStatement" ||
		block.type === "ForStatement"
	);
}

/**
 * Checks whether or not a given declarator node has its initializer.
 * @param {ASTNode} node A declarator node to check.
 * @returns {boolean} `true` when the node has its initializer.
 */
function isInitialized(node) {
	const declaration = node.parent;
	const block = declaration.parent;

	if (isForLoop(block)) {
		if (block.type === "ForStatement") {
			return block.init === declaration;
		}
		return block.left === declaration;
	}
	return Boolean(node.init);
}

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

/** @type {import('../types').Rule.RuleModule} */
module.exports = {
	meta: {
		type: "suggestion",
		dialects: ["typescript", "javascript"],
		language: "javascript",

		docs: {
			description:
				"Require or disallow initialization in variable declarations",
			recommended: false,
			frozen: true,
			url: "https://eslint.org/docs/latest/rules/init-declarations",
		},

		schema: {
			anyOf: [
				{
					type: "array",
					items: [
						{
							enum: ["always"],
						},
					],
					minItems: 0,
					maxItems: 1,
				},
				{
					type: "array",
					items: [
						{
							enum: ["never"],
						},
						{
							type: "object",
							properties: {
								ignoreForLoopInit: {
									type: "boolean",
								},
							},
							additionalProperties: false,
						},
					],
					minItems: 0,
					maxItems: 2,
				},
			],
		},
		messages: {
			initialized:
				"Variable '{{idName}}' should be initialized on declaration.",
			notInitialized:
				"Variable '{{idName}}' should not be initialized on declaration.",
		},
	},

	create(context) {
		const MODE_ALWAYS = "always",
			MODE_NEVER = "never";

		const mode = context.options[0] || MODE_ALWAYS;
		const params = context.options[1] || {};

		// Track whether we're inside a declared namespace
		let insideDeclaredNamespace = false;

		//--------------------------------------------------------------------------
		// Public API
		//--------------------------------------------------------------------------

		return {
			TSModuleDeclaration(node) {
				if (node.declare) {
					insideDeclaredNamespace = true;
				}
			},

			"TSModuleDeclaration:exit"(node) {
				if (node.declare) {
					insideDeclaredNamespace = false;
				}
			},

			"VariableDeclaration:exit"(node) {
				const kind = node.kind,
					declarations = node.declarations;

				if (node.declare || insideDeclaredNamespace) {
					return;
				}

				for (let i = 0; i < declarations.length; ++i) {
					const declaration = declarations[i],
						id = declaration.id,
						initialized = isInitialized(declaration),
						isIgnoredForLoop =
							params.ignoreForLoopInit && isForLoop(node.parent);
					let messageId = "";

					if (mode === MODE_ALWAYS && !initialized) {
						messageId = "initialized";
					} else if (
						mode === MODE_NEVER &&
						!CONSTANT_BINDINGS.has(kind) &&
						initialized &&
						!isIgnoredForLoop
					) {
						messageId = "notInitialized";
					}

					if (id.type === "Identifier" && messageId) {
						context.report({
							node: declaration,
							messageId,
							data: {
								idName: id.name,
							},
						});
					}
				}
			},
		};
	},
};
