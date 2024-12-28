import  { type TokenizerExtension, marked } from 'marked';


export const markedSpoilerExtension = (): TokenizerExtension[] => {
	const markedBlockSpoiler: TokenizerExtension = {
		name: 'spoiler',
		level: 'block',
		start(src) {
			return src.indexOf("[spoiler]");
		},
		tokenizer(src: string) {
			const rule = /^\[spoiler\]([\s\S]+?)\[\/spoiler\]/;
			const match = rule.exec(src);
			if (match) {
				return {
					type: "spoiler",
					raw: match[0],
					text: match[1].trim(),
				};
			}
			
			return undefined
		},

		renderer(token: any) {
			return `<details><summary>Spoiler</summary>${marked(token.text)}</details>`;
		}

	}

	const markedInlineSpoiler: TokenizerExtension = {
		name: 'inlinespoiler',
		level: 'inline',
		start(src) {
			return src.indexOf("!!");
		},
		tokenizer(src: string) {
			const rule = /^!!([^\s][^]*?[^\s])!!(?!\s)/
			const match = src.match(rule)
			if (match) {
				return {
					type: "inlinespoiler",
					raw: match[0],
					text: match[1].trim(),
					tokens: this.lexer.inlineTokens(match[1].trim()),
				};
			}
			
			return undefined
		},

		renderer(token: any) {
			return `<span class="spoiler">${this.parser.parseInline(token.tokens)}</span>`;
		}

	}

	return [markedBlockSpoiler, markedInlineSpoiler]

}

