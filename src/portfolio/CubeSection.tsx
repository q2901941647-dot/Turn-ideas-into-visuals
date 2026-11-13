import { Reveal } from './ui';
import CubeScene from './CubeScene';

export function CubeSection() {
  return (
    <section className="section cube-section" id="cube">
      <div className="section-head">
        <div className="section-index">
          <span className="index-no">03</span>
          <span className="index-rule" />
          <span className="index-en">VISUAL EXPERIMENTS / REAL-TIME 3D</span>
        </div>
        <Reveal className="section-title-wrap split-head">
          <h2 className="section-title">
            实时渲染<br />
            <em>实验场</em>
          </h2>
          <p className="section-lead">
            拖拽立方体，感受玻璃折射与虹彩薄膜；背后的文字会随镜面实时变形。一组关于「想法成画」的实时视觉实验。
          </p>
        </Reveal>
      </div>

      <div className="cube-stage">
        <CubeScene />
      </div>

      <div className="cube-foot">
        <span>WEBGL · THREE.JS · MESH PHYSICAL</span>
        <p>实时渲染需要 WebGL 支持；移动端同样可拖拽旋转。</p>
      </div>
    </section>
  );
}
