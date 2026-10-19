/**
 * 带自动选路的推送：直连 / 本地代理逐个探测，谁通用谁。
 *
 * 为什么需要它：git 的全局 http.proxy 指向某个本地代理端口，
 * 但代理软件时开时关、节点时好时坏，`git push` 经常直接报
 * "Failed to connect" 或 "schannel: failed to receive handshake"。
 * 这个脚本先测 GitHub 到底怎么才能连通，再决定用什么方式推。
 *
 * 用法：npm run push
 * 「发布」任务最后一步已经换成它。
 */
import { spawnSync } from 'node:child_process'

const NUL = process.platform === 'win32' ? 'NUL' : '/dev/null'

const CANDIDATES = [
  { label: '直连', proxy: null },
  { label: '代理 7897（Clash 默认）', proxy: 'http://127.0.0.1:7897' },
  { label: '代理 51019', proxy: 'http://127.0.0.1:51019' },
  { label: '代理 10809', proxy: 'http://127.0.0.1:10809' },
  { label: '代理 1080', proxy: 'http://127.0.0.1:1080' },
]

function reachable(proxy) {
  const args = [
    ...(proxy ? ['-x', proxy] : ['--noproxy', '*']),
    '-s',
    '-o',
    NUL,
    '-w',
    '%{http_code}',
    '-m',
    '6',
    'https://github.com/',
  ]
  try {
    const r = spawnSync('curl', args, { encoding: 'utf8', timeout: 12000 })
    return (r.stdout || '').trim() === '200'
  } catch {
    return false
  }
}

function push(proxy) {
  const override = proxy
    ? ['-c', `http.proxy=${proxy}`, '-c', `https.proxy=${proxy}`]
    : ['-c', 'http.proxy=', '-c', 'https.proxy=']
  const r = spawnSync('git', [...override, 'push', 'origin', 'main'], { stdio: 'inherit' })
  return r.status === 0
}

console.log('正在探测 GitHub 连通性…\n')

for (const c of CANDIDATES) {
  const ok = reachable(c.proxy)
  console.log(`  ${ok ? '✓' : '✗'} ${c.label}`)
  if (!ok) continue

  console.log(`\n用「${c.label}」推送…\n`)
  if (push(c.proxy)) {
    console.log('\n推送完成。约 60 秒后 GitHub Actions 会自动构建上线。')
    process.exit(0)
  }
  console.log(`\n「${c.label}」推送失败，换下一条路。\n`)
}

console.error(
  '\n所有方式都失败了。检查：\n' +
    '  1. 代理软件是否在运行（Clash 之类）\n' +
    '  2. 网络是否正常（浏览器能打开 github.com 吗）\n' +
    '  3. 稍等几分钟再试，GitHub 在国内时通时断属于常态'
)
process.exit(1)
