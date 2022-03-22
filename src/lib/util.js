export function stringifySrc(src) {
	const res = `String.raw\`${src.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\``;
	return res;
}

export function parseSrc(src) {
	const res = src.replace(/\\`/g, '`');
	return res;
}
