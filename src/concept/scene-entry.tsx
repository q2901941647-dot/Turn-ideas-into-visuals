import { createRoot } from 'react-dom/client';
import JupiterScene from '../components/JupiterScene';

/**
 * 概念稿的 3D 挂载点：直接复用作品集既有的 JupiterScene，
 * 不改场景内容，只通过构图参数把它重新「摆位」到新的首屏排版里。
 *
 *  - offsetX 1.9  ：木星右移，左侧文字区完全留出（行星球心约在 x=1211 / 1440）
 *  - distance 5.7 ：木星缩小到屏幕半径约 400px，左侧出现干净的黑色通道
 *  - orbitAngle -0.15 ：太阳落在标题右侧、行星左侧的空白里
 *
 * 窄屏暂不挂 3D：横向构图里的太阳会压到顶部标签上，
 * 需要一套竖向构图（行星在上、文字在下）才成立，留给全站落地时单独处理。
 */
const host = document.getElementById('scene-root');
const wide = window.matchMedia('(min-width: 900px)').matches;

if (host && wide) {
  createRoot(host).render(
    <JupiterScene active distance={5.7} offsetX={1.9} orbitAngle={-0.15} />
  );
  document.body.classList.add('has-scene');
}
