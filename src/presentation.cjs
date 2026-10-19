const MODAL_MODES = new Set(['add', 'manage', 'privacy', 'blur', 'lock']);
function overlayPresentation(mode, platform, dark) {
 const modal = MODAL_MODES.has(mode);
 if (mode === 'pick-left' || mode === 'pick-right') return {hideServices:false,background:dark?'#161616':'#ffffff'};
 return { hideServices: modal, background: platform === 'linux' && modal ? (dark ? '#161e1b' : '#edf2f1') : '#00000000' };
}
module.exports = { overlayPresentation };
