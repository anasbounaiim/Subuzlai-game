declare module '*.css' {
  const content: any;
  export default content;
}

interface Window {
  webkitAudioContext?: typeof AudioContext;
}
