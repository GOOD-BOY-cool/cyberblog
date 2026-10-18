/**
 * 关掉占用 4321 端口的本地服务（npm run dev / npm run preview）
 * 用途：终端被关掉、窗口找不到进程，但端口还占着 4321 的时候
 * 用法：npm run stop
 */
import { execSync } from 'node:child_process'

const PORT = 4321
const isWin = process.platform === 'win32'

function findPids() {
  try {
    if (isWin) {
      const out = execSync('netstat -ano', { encoding: 'utf8' })
      const pids = new Set()
      for (const line of out.split(/\r?\n/)) {
        if (!/LISTENING/i.test(line)) continue
        if (!new RegExp(`:${PORT}\\s`).test(line)) continue
        const hit = line.trim().match(/(\d+)$/)
        if (hit && hit[1] !== '0') pids.add(hit[1])
      }
      return [...pids]
    }
    const out = execSync(`lsof -ti tcp:${PORT}`, { encoding: 'utf8' })
    return out.split(/\s+/).filter(Boolean)
  } catch {
    return []
  }
}

function kill(pid) {
  try {
    if (isWin) execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' })
    else process.kill(Number(pid), 'SIGKILL')
    return true
  } catch {
    return false
  }
}

const pids = findPids()

if (pids.length === 0) {
  console.log(`端口 ${PORT} 没有被占用，本地服务本来就没在跑。`)
  process.exit(0)
}

console.log(`发现 ${pids.length} 个进程占用端口 ${PORT}：${pids.join(', ')}`)
for (const pid of pids) {
  console.log(kill(pid) ? `  已结束 PID ${pid}` : `  结束失败 PID ${pid}（可能权限不足，用管理员终端重试）`)
}

setTimeout(() => {
  const left = findPids()
  console.log(left.length === 0 ? `端口 ${PORT} 已释放，现在可以重新启动服务了。` : `仍被占用：${left.join(', ')}`)
}, 500)
