import type { TurningMode } from '@/types/slides'

export const ANIMATION_DEFAULT_DURATION = 1000
export const ANIMATION_DEFAULT_TRIGGER = 'click'
export const ANIMATION_CLASS_PREFIX = 'animate__'

export const ENTER_ANIMATIONS = [
  {
    type: 'bounce',
    name: 'バウンド',
    children: [
      { name: '弾んで表示', value: 'bounceIn' },
      { name: '右へ弾んで表示', value: 'bounceInLeft' },
      { name: '左へ弾んで表示', value: 'bounceInRight' },
      { name: '上へ弾んで表示', value: 'bounceInUp' },
      { name: '下へ弾んで表示', value: 'bounceInDown' },
    ],
  },
  {
    type: 'fade',
    name: 'フェード',
    children: [
      { name: 'フェードイン', value: 'fadeIn' },
      { name: '下へフェードイン', value: 'fadeInDown' },
      { name: '下へフェードイン（長距離）', value: 'fadeInDownBig' },
      { name: '右へフェードイン', value: 'fadeInLeft' },
      { name: '右へフェードイン（長距離）', value: 'fadeInLeftBig' },
      { name: '左へフェードイン', value: 'fadeInRight' },
      { name: '左へフェードイン（長距離）', value: 'fadeInRightBig' },
      { name: '上へフェードイン', value: 'fadeInUp' },
      { name: '上へフェードイン（長距離）', value: 'fadeInUpBig' },
      { name: '左上からフェードイン', value: 'fadeInTopLeft' },
      { name: '右上からフェードイン', value: 'fadeInTopRight' },
      { name: '左下からフェードイン', value: 'fadeInBottomLeft' },
      { name: '右下からフェードイン', value: 'fadeInBottomRight' },
    ],
  },
  {
    type: 'rotate',
    name: '回転',
    children: [
      { name: '回転して表示', value: 'rotateIn' },
      { name: '左下を軸に回転して表示', value: 'rotateInDownLeft' },
      { name: '右下を軸に回転して表示', value: 'rotateInDownRight' },
      { name: '左上を軸に回転して表示', value: 'rotateInUpLeft' },
      { name: '右上を軸に回転して表示', value: 'rotateInUpRight' },
    ],
  },
  {
    type: 'zoom',
    name: '拡大・縮小',
    children: [
      { name: '拡大して表示', value: 'zoomIn' },
      { name: '下へ拡大して表示', value: 'zoomInDown' },
      { name: '左から拡大して表示', value: 'zoomInLeft' },
      { name: '右から拡大して表示', value: 'zoomInRight' },
      { name: '上へ拡大して表示', value: 'zoomInUp' },
    ],
  },
  {
    type: 'slide',
    name: 'スライドイン',
    children: [
      { name: '下へスライドイン', value: 'slideInDown' },
      { name: '右からスライドイン', value: 'slideInLeft' },
      { name: '左からスライドイン', value: 'slideInRight' },
      { name: '上へスライドイン', value: 'slideInUp' },
    ],
  },
  {
    type: 'flip',
    name: '反転',
    children: [
      { name: 'X軸で反転して表示', value: 'flipInX' },
      { name: 'Y軸で反転して表示', value: 'flipInY' },
    ],
  },
  {
    type: 'back',
    name: '拡大してスライドイン',
    children: [
      { name: '下へ拡大してスライドイン', value: 'backInDown' },
      { name: '左から拡大してスライドイン', value: 'backInLeft' },
      { name: '右から拡大してスライドイン', value: 'backInRight' },
      { name: '上へ拡大してスライドイン', value: 'backInUp' },
    ],
  },
  {
    type: 'lightSpeed',
    name: '飛び込む',
    children: [
      { name: '右から飛び込む', value: 'lightSpeedInRight' },
      { name: '左から飛び込む', value: 'lightSpeedInLeft' },
    ],
  },
]

export const EXIT_ANIMATIONS = [
  {
    type: 'bounce',
    name: 'バウンド',
    children: [
      { name: '弾んで消える', value: 'bounceOut' },
      { name: '左へ弾んで消える', value: 'bounceOutLeft' },
      { name: '右へ弾んで消える', value: 'bounceOutRight' },
      { name: '上へ弾んで消える', value: 'bounceOutUp' },
      { name: '下へ弾んで消える', value: 'bounceOutDown' },
    ],
  },
  {
    type: 'fade',
    name: 'フェード',
    children: [
      { name: 'フェードアウト', value: 'fadeOut' },
      { name: '下へフェードアウト', value: 'fadeOutDown' },
      { name: '下へフェードアウト（長距離）', value: 'fadeOutDownBig' },
      { name: '左へフェードアウト', value: 'fadeOutLeft' },
      { name: '左へフェードアウト（長距離）', value: 'fadeOutLeftBig' },
      { name: '右へフェードアウト', value: 'fadeOutRight' },
      { name: '右へフェードアウト（長距離）', value: 'fadeOutRightBig' },
      { name: '上へフェードアウト', value: 'fadeOutUp' },
      { name: '上へフェードアウト（長距離）', value: 'fadeOutUpBig' },
      { name: '左上からフェードアウト', value: 'fadeOutTopLeft' },
      { name: '右上からフェードアウト', value: 'fadeOutTopRight' },
      { name: '左下からフェードアウト', value: 'fadeOutBottomLeft' },
      { name: '右下からフェードアウト', value: 'fadeOutBottomRight' },
    ],
  },
  {
    type: 'rotate',
    name: '回転',
    children: [
      { name: '回転して消える', value: 'rotateOut' },
      { name: '左下を軸に回転して消える', value: 'rotateOutDownLeft' },
      { name: '右下を軸に回転して消える', value: 'rotateOutDownRight' },
      { name: '左上を軸に回転して消える', value: 'rotateOutUpLeft' },
      { name: '右上を軸に回転して消える', value: 'rotateOutUpRight' },
    ],
  },
  {
    type: 'zoom',
    name: '拡大・縮小',
    children: [
      { name: '縮小して消える', value: 'zoomOut' },
      { name: '下へ縮小して消える', value: 'zoomOutDown' },
      { name: '左から縮小して消える', value: 'zoomOutLeft' },
      { name: '右から縮小して消える', value: 'zoomOutRight' },
      { name: '上へ縮小して消える', value: 'zoomOutUp' },
    ],
  },
  {
    type: 'slide',
    name: 'スライドアウト',
    children: [
      { name: '下へスライドアウト', value: 'slideOutDown' },
      { name: '左からスライドアウト', value: 'slideOutLeft' },
      { name: '右からスライドアウト', value: 'slideOutRight' },
      { name: '上へスライドアウト', value: 'slideOutUp' },
    ],
  },
  {
    type: 'flip',
    name: '反転',
    children: [
      { name: 'X軸で反転して消える', value: 'flipOutX' },
      { name: 'Y軸で反転して消える', value: 'flipOutY' },
    ],
  },
  {
    type: 'back',
    name: '縮小してスライドアウト',
    children: [
      { name: '下へ縮小してスライドアウト', value: 'backOutDown' },
      { name: '左から縮小してスライドアウト', value: 'backOutLeft' },
      { name: '右から縮小してスライドアウト', value: 'backOutRight' },
      { name: '上へ縮小してスライドアウト', value: 'backOutUp' },
    ],
  },
  {
    type: 'lightSpeed',
    name: '飛び出す',
    children: [
      { name: '右から飛び出す', value: 'lightSpeedOutRight' },
      { name: '左から飛び出す', value: 'lightSpeedOutLeft' },
    ],
  },
]

export const ATTENTION_ANIMATIONS = [
  {
    type: 'shake',
    name: '揺れ',
    children: [
      { name: '左右に揺れる', value: 'shakeX' },
      { name: '上下に揺れる', value: 'shakeY' },
      { name: '首振り', value: 'headShake' },
      { name: 'スイング', value: 'swing' },
      { name: '揺れ', value: 'wobble' },
      { name: '拡大して揺れる', value: 'tada' },
      { name: '弾む', value: 'jello' },
    ],
  },
  {
    type: 'other',
    name: 'その他',
    children: [
      { name: 'バウンド', value: 'bounce' },
      { name: '点滅', value: 'flash' },
      { name: '脈動', value: 'pulse' },
      { name: '伸縮', value: 'rubberBand' },
      { name: '鼓動（速い）', value: 'heartBeat' },
    ],
  },
]

interface SlideAnimation {
  label: string
  value: TurningMode
}

export const SLIDE_ANIMATIONS: SlideAnimation[] = [
  { label: 'なし', value: 'no' },
  { label: 'ランダム', value: 'random' },
  { label: '左右にスライド', value: 'slideX' },
  { label: '上下にスライド', value: 'slideY' },
  { label: '左右にスライド（3D）', value: 'slideX3D' },
  { label: '上下にスライド（3D）', value: 'slideY3D' },
  { label: 'フェード', value: 'fade' },
  { label: '回転', value: 'rotate' },
  { label: '上下に展開', value: 'scaleY' },
  { label: '左右に展開', value: 'scaleX' },
  { label: '拡大', value: 'scale' },
  { label: '縮小', value: 'scaleReverse' },
  { label: '左右にワイプ', value: 'wipeX' },
  { label: '上下にワイプ', value: 'wipeY' },
  { label: '円形に展開', value: 'circle' },
  { label: 'ひし形に展開', value: 'diamond' },
  { label: '左上から右下へスライド', value: 'slideDiagonal' },
  { label: '右上から左下へスライド', value: 'slideDiagonalReverse' },
  { label: '中央から左右に展開', value: 'revealX' },
  { label: '中央から上下に展開', value: 'revealY' },
  { label: '左右に反転して展開', value: 'flipY' },
  { label: '上下に反転して展開', value: 'flipX' },
]