<script>
import { h, defineComponent } from 'vue';

// 1. 🎯 內部共用的基礎按鈕邏輯（修復版：完美展開子節點，捍衛文字渲染）
const BaseButton = (props, { slots }) => {
  const children = [];

  // 如果有傳入圖標，塞入圖標 span
  if (props.icon) {
    children.push(h('span', { class: 'btn-icon' }, props.icon));
  }

  // 核心修正：如果有傳入 text，直接以純文字或帶類別的 span 形式塞入陣列
  if (props.text) {
    children.push(h('span', { class: 'btn-text' }, props.text));
  }

  // 同時融合外部可能傳入的預設插槽 (Slot)，確保最大彈性
  if (slots.default) {
    children.push(slots.default());
  }

  // 🎯 這裡直接傳入完整的 children 陣列，Vue 3 就能百分之百正確渲染出所有內部文字與圖標
  return h(
    'button',
    {
      class: ['btn', props.variant ? `btn-${props.variant}` : ''],
      title: props.title,
      disabled: props.disabled,
    },
    children
  );
};

// 2. 定義並匯出切換按鈕 (修改/儲存)
export const ToggleButton = defineComponent({
  props: { isEditing: Boolean },
  emits: ['click'],
  setup(props, { emit }) {
    return () =>
      h(BaseButton, {
        variant: props.isEditing ? 'success' : 'primary',
        icon: props.isEditing ? '💾' : '✎',
        text: props.isEditing ? '儲存內容' : '修改資料',
        onClick: (e) => {
          e.stopPropagation();
          emit('click');
        },
      });
  },
});

// 4. 擴充：響應式按鈕 (小畫面自動隱藏文字、僅留圖標)
export const ResponsiveButton = defineComponent({
  props: {
    variant: { type: String, default: 'primary' },
    icon: { type: String, required: true },
    text: { type: String, required: true },
    disabled: Boolean,
  },
  emits: ['click'],
  setup(props, { emit }) {
    return () =>
      h(BaseButton, {
        variant: props.variant,
        icon: props.icon,
        text: props.text,
        disabled: props.disabled,
        onClick: (e) => {
          e.stopPropagation();
          emit('click');
        },
      });
  },
});

// 5. 🎯 擴充：純文字按鈕 (無圖標、寬度永遠隨字數自適應)
// 我們不使用帶有 .btn-text 的 BaseButton，直接自刻最純粹的原生 HTML 按鈕，徹底對手機版隱藏規則免疫！
export const OutlineButton = defineComponent({
  props: {
    text: { type: String, required: true },
    disabled: Boolean,
  },
  emits: ['click'],
  setup(props, { emit }) {
    return () =>
      h(
        'button',
        {
          class: ['btn', 'btn-outline'], // 完美串接您的 theme.css
          disabled: props.disabled,
          onClick: (e) => {
            e.stopPropagation();
            emit('click');
          },
        },
        props.text
      ); // ⚡ 終極防線：直接作為 button 的純文字內容傳入，絕不包覆任何 span，字體絕對顯現！
  },
});

export default {};
</script>
