import { Seal } from '../../index.js'
import { getLibrary } from '../../index'
import { MemoryPoolHandle } from '../../components'

let Morfix = null
let MemoryPoolHandleObject = null
beforeAll(async () => {
  Morfix = await Seal
  const lib = getLibrary()
  MemoryPoolHandleObject = MemoryPoolHandle(lib)(Morfix)
})

describe('MemoryPoolHandle', () => {
  test('It should be a static instance', () => {
    expect(MemoryPoolHandleObject).toBeDefined()
    expect(typeof MemoryPoolHandleObject.constructor).toBe('function')
    expect(MemoryPoolHandleObject).toBeInstanceOf(Object)
    expect(MemoryPoolHandleObject.constructor).toBe(Object)
    expect(MemoryPoolHandleObject.constructor.name).toBe('Object')
  })
  test('It should have properties', () => {
    expect(MemoryPoolHandleObject).toHaveProperty('global')
    expect(MemoryPoolHandleObject).toHaveProperty('threadLocal')
  })
  test('It should return a pointer to the global handle', () => {
    const pool = MemoryPoolHandleObject.global
    expect(pool).toBeDefined()
    expect(typeof pool.constructor).toBe('function')
    expect(pool).toBeInstanceOf(Object)
    expect(pool.constructor).toBe(MemoryPoolHandleObject.global.constructor)
    expect(MemoryPoolHandleObject.global.constructor.name).toBe(
      'MemoryPoolHandle'
    )
  })
  test('It should return a pointer to a threadLocal handle', () => {
    const pool = MemoryPoolHandleObject.threadLocal
    expect(pool).toBeDefined()
    expect(typeof pool.constructor).toBe('function')
    expect(pool).toBeInstanceOf(Object)
    expect(pool.constructor).toBe(
      MemoryPoolHandleObject.threadLocal.constructor
    )
    expect(MemoryPoolHandleObject.threadLocal.constructor.name).toBe(
      'MemoryPoolHandle'
    )
  })
})
