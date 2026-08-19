import path from 'node:path'
import { defineConfig } from '@tarojs/cli'
import tailwindcss from '@tailwindcss/postcss'
import { UnifiedViteWeappTailwindcssPlugin } from 'weapp-tailwindcss/vite'
import devConfig from './dev'
import prodConfig from './prod'

// Taro 4 + React config. The mini-program (weapp) build and the H5 build share
// this one config. The AutoAgent platform previews the **H5** dev server on
// http://localhost:5173/ during a session; the weapp bundle is produced at
// publish time. Do not change the h5.devServer host/port — the platform's
// frontend preview contract depends on 0.0.0.0:5173.
//
// Compiler is **Vite** (@tarojs/vite-runner): the H5 dev server serves source
// as native ESM (esbuild transform, no full bundle), so dev-server memory and
// cold-start are far lower than webpack5 — which OOM-killed (exit 137) the H5
// build in the 2Gi sandbox and left the preview stuck in a crash-restart loop.
export default defineConfig<'vite'>(async (merge) => {
  const baseConfig: any = {
    projectName: 'wx-miniapp',
    date: '2026-07-16',
    designWidth: 750,
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      828: 1.81 / 2,
    },
    sourceRoot: 'src',
    // weapp 与 h5 用独立 outputRoot，避免共用一个目录互相清空/覆盖。H5 dev server
    // (`taro build --type h5 --watch`) 常驻独占 `dist/`；weapp (`build:weapp`，预览码/发布用)
    // 出到 `dist-weapp/`。二者永不碰同一目录 —— 否则 build:weapp 会污染 dist/ 让 H5 的
    // emptyOutputDir 崩、或 H5 首建清 dist/ 抹掉 weapp 的 app.json 致上传失败。
    // TARO_ENV 由 Taro CLI 按 --type 设（'h5' / 'weapp'）。project.config.json 的
    // miniprogramRoot 必须与 weapp 输出目录一致（= 'dist-weapp/'）。
    outputRoot: process.env.TARO_ENV === 'h5' ? 'dist' : 'dist-weapp',
    plugins: [],
    defineConstants: {},
    copy: {
      patterns: [],
      options: {},
    },
    framework: 'react',
    compiler: {
      type: 'vite',
      vitePlugins: [
        {
          name: 'postcss-config-loader-plugin',
          config(config) {
            config.css ??= {}
            config.css.postcss ??= {}
            config.css.postcss.plugins ??= []
            config.css.postcss.plugins.unshift(tailwindcss())
          },
        },
        ...(process.env.TARO_ENV === 'weapp'
          ? [
              UnifiedViteWeappTailwindcssPlugin({
                appType: 'taro',
                rem2rpx: true,
                supportCustomLengthUnitsPatch: false,
                cssEntries: [path.resolve(__dirname, '../src/app.css')],
              }),
            ]
          : []),
      ],
    },
    jsMinimizer: 'esbuild',
    mini: {
      postcss: {
        pxtransform: { enable: true, config: {} },
        cssModules: {
          enable: false,
        },
      },
    },
    h5: {
      publicPath: '/',
      staticDirectory: 'static',
      // H5 路由用 hash 模式（与小程序页面路径结构对齐），显式声明以避免 Taro 默认路由
      // 回退触发的额外告警。
      // ⚠️ 严禁给 h5.router 加 `basename`（尤其 `basename: '/'`）：Taro H5 的 hash 路由
      // 叠加 basename 会让路由匹配错乱——匹配不到任何已注册页面，导致 React/Taro 挂载
      // 产出空的 `<div id="app">`、整页白屏，且 Console/Network 均无报错，极难排查。
      // 需要子路径部署时也不要在此写死 basename（平台发布走独立域名根路径）。
      router: {
        mode: 'hash',
      },
      // Preview contract: the platform probes and renders http://localhost:5173/.
      // Taro-Vite maps h5.devServer onto Vite's `server` options. Vite's dev
      // server does not Host-check by default; `allowedHosts: true` keeps the
      // platform's dynamic preview domain accepted on Vite 5+ too.
      devServer: {
        host: '0.0.0.0',
        port: 5173,
        strictPort: true,
        allowedHosts: true,
        // Source changes are detected through polling (NFS/overlay fs 下 inotify 不可靠)。
        // 只有 `src/` 下的源码改动会被热更新；改了 `config/`、`package.json` 或环境变量
        // 必须重启 `pnpm run dev:h5` / `frontend_start.sh` 才生效——否则测到的是旧配置。
        // Source changes are detected through polling.
        // Changes under config/, package.json, or environment variables require
        // restarting `pnpm run dev:h5` / `frontend_start.sh`.
        watch: {
          usePolling: true,
          interval: 1000,
        },
        hmr: {
          overlay: false,
        },
      },
      postcss: {
        autoprefixer: { enable: true },
        pxtransform: { enable: true, config: { platform: 'h5' } },
        cssModules: {
          enable: false,
        },
      },
    },
  }

  return merge(
    {},
    baseConfig,
    process.env.NODE_ENV === 'development' ? devConfig : prodConfig,
  )
})
