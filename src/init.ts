import { createApp, h, reactive, watchEffect } from 'vue';
import Toast from "vue-toastification";
import TruncateReadMore from 'vue-truncate-read-more';

import { commentCount } from './comment.js';
import Waline from './components/WalineComment.vue';
import { pageviewCount } from './pageview.js';
import type { WalineInitOptions } from './typings/index.js';
import { getRoot, isString } from './utils/index.js';

export interface WalineInstance {
  /**
   * Waline 被挂载到的元素
   *
   * @description 当通过 `el: null` 初始化，值为 `null`
   *
   * Element where Waline is mounted
   *
   * @description when initialized with `el: null`, it will be `null`
   */
  el: HTMLElement | null;

  /**
   * 更新 Waline 实例
   *
   * @description 只要不设置`path` 选项，更新时它就会被重置为 `windows.location.pathname`
   *
   * Update Waline instance
   *
   * @description when not setting `path` option, it will be reset to `window.location.pathname`
   */
  update: (newOptions?: Partial<Omit<WalineInitOptions, 'el'>>) => void;

  /**
   * 取消挂载并摧毁 Waline 实例
   *
   * Unmount and destroy Waline instance
   */
  destroy: () => void;
}

export const init = ({
  el = '#waline',
  path = window.location.pathname,
  comment = false,
  pageview = false,
  ...initProps
}: WalineInitOptions): WalineInstance | null => {
  // check el element
  const root = el ? getRoot(el) : null;

  // check root
  if (el && !root) throw new Error(`Option 'el' do not match any domElement!`);

  // check serverURL
  if (!initProps.serverURL) throw new Error("Option 'serverURL' is missing!");

  const props = reactive({ ...initProps });
  const state = reactive({ comment, pageview, path });

  const updateCommentCount = (): void => {
    if (state.comment)
      commentCount({
        serverURL: props.serverURL,
        path: state.path,
        ...(isString(state.comment) ? { selector: state.comment } : {}),
      });
  };

  const updatePageviewCount = (): void => {
    if (state.pageview)
      pageviewCount({
        serverURL: props.serverURL,
        path: state.path,
        ...(isString(state.pageview) ? { selector: state.pageview } : {}),
      });
  };

  const app = root
    ? createApp(() => h(Waline, { path: state.path, ...props }))
    : null;
	
  if (app) {
		app.use(Toast, {
			position: 'top-right',
			timeout: 3000,
		});
		app.use(TruncateReadMore);
		app.mount(root!);
	}

  const stopComment = watchEffect(updateCommentCount);
  const stopPageview = watchEffect(updatePageviewCount);

  return {
    el: root,
    update: ({
      comment,
      pageview,
      path = window.location.pathname,
      ...newProps
    }: Partial<Omit<WalineInitOptions, 'el'>> = {}): void => {
      Object.entries(newProps).forEach(([key, value]) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line
        props[key] = value;
      });

      state.path = path;
      if (comment !== undefined) state.comment = comment;
      if (pageview !== undefined) state.pageview = pageview;
    },
    destroy: (): void => {
      app?.unmount();
      stopComment();
      stopPageview();
    },
  };
};
