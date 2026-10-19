// Keep native view stacking and Linux display selection explicit and testable.
const MODAL_MODES = new Set(['add','manage','privacy','blur','lock']);
function linuxDisplayBackend(platform, env, explicitBackend) {
 if (platform !== 'linux' || explicitBackend || env.XDG_SESSION_TYPE !== 'wayland' || !env.DISPLAY) return undefined;
 return 'x11'; // XWayland supports the focus/window APIs used by DuoChat.
}
function overlayPresentation(mode, platform, dark) {
 const modal = MODAL_MODES.has(mode);
 return { hideServices: modal, background: platform === 'linux' && modal ? (dark ? '#161e1b' : '#edf2f1') : '#00000000' };
}
module.exports = {linuxDisplayBackend,overlayPresentation};
