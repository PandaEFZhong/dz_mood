'use client'

import { useState, ReactNode } from 'react'

interface DevicePreset {
  name: string
  width: number
  height: number
  hasNotch: boolean
  hasDynamicIsland: boolean
  scale: number
}

const DEVICE_PRESETS: DevicePreset[] = [
  { name: 'iPhone SE', width: 375, height: 667, hasNotch: false, hasDynamicIsland: false, scale: 1 },
  { name: 'iPhone 12/13/14', width: 390, height: 844, hasNotch: true, hasDynamicIsland: false, scale: 1 },
  { name: 'iPhone 14 Pro/15', width: 393, height: 852, hasNotch: false, hasDynamicIsland: true, scale: 1 },
  { name: 'iPhone 14 Pro Max', width: 430, height: 932, hasNotch: false, hasDynamicIsland: true, scale: 1 },
  { name: 'Android Small', width: 360, height: 640, hasNotch: false, hasDynamicIsland: false, scale: 1 },
  { name: 'Android Medium', width: 393, height: 851, hasNotch: true, hasDynamicIsland: false, scale: 1 },
  { name: 'Android Large', width: 412, height: 915, hasNotch: true, hasDynamicIsland: false, scale: 1 },
]

interface DeviceSimulatorProps {
  children: ReactNode
}

export default function DeviceSimulator({ children }: DeviceSimulatorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState<DevicePreset>(DEVICE_PRESETS[2])
  const [zoom, setZoom] = useState(0.85)
  const [showFrame, setShowFrame] = useState(true)
  const [landscape, setLandscape] = useState(false)

  const currentWidth = landscape ? selectedDevice.height : selectedDevice.width
  const currentHeight = landscape ? selectedDevice.width : selectedDevice.height

  return (
    <div className="flex h-screen overflow-hidden bg-gray-900">
      {/* 侧边栏 */}
      <div className={`${isOpen ? 'w-72' : 'w-0'} transition-all duration-300 bg-gray-800 border-r border-gray-700 overflow-hidden flex flex-col shrink-0`}>
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold text-white">📱 设备模拟器</h2>
          <p className="text-xs text-gray-400 mt-1">切换屏幕尺寸预览</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* 设备选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">设备型号</label>
            <div className="space-y-2">
              {DEVICE_PRESETS.map((device) => (
                <button
                  key={device.name}
                  onClick={() => setSelectedDevice(device)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedDevice.name === device.name
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <div className="font-medium">{device.name}</div>
                  <div className="text-xs opacity-75">
                    {device.width} × {device.height}
                    {device.hasDynamicIsland && ' · 灵动岛'}
                    {device.hasNotch && !device.hasDynamicIsland && ' · 刘海'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 缩放控制 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              缩放: {Math.round(zoom * 100)}%
            </label>
            <input
              type="range"
              min="0.5"
              max="1.2"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          {/* 选项开关 */}
          <div className="space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-gray-300">显示手机边框</span>
              <input
                type="checkbox"
                checked={showFrame}
                onChange={(e) => setShowFrame(e.target.checked)}
                className="w-4 h-4 accent-blue-500"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-gray-300">横屏模式</span>
              <input
                type="checkbox"
                checked={landscape}
                onChange={(e) => setLandscape(e.target.checked)}
                className="w-4 h-4 accent-blue-500"
              />
            </label>
          </div>

          {/* 当前设备信息 */}
          <div className="p-3 bg-gray-700 rounded-lg">
            <div className="text-xs text-gray-400 mb-1">当前尺寸</div>
            <div className="text-sm text-white font-mono">
              {Math.round(currentWidth)} × {Math.round(currentHeight)}
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部工具栏 */}
        <div className="h-14 bg-gray-800 border-b border-gray-700 flex items-center px-4 shrink-0">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            {isOpen ? '隐藏侧边栏' : '设备模拟器'}
          </button>

          {!isOpen && (
            <div className="ml-4 flex items-center gap-4 text-sm text-gray-400">
              <span>{selectedDevice.name}</span>
              <span className="text-gray-600">|</span>
              <span>{Math.round(currentWidth)} × {Math.round(currentHeight)}</span>
              <span className="text-gray-600">|</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
          )}

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.05))}
              className="p-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              title="缩小"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-sm text-gray-400 w-12 text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(Math.min(1.2, zoom + 0.05))}
              className="p-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              title="放大"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        {/* 预览区域 */}
        <div className="flex-1 overflow-auto bg-gray-950 flex items-center justify-center p-8">
          {/* 手机框架 */}
          <div
            className={`relative transition-all duration-300 ${showFrame ? 'p-3 bg-gray-800 rounded-[3rem] shadow-2xl' : ''}`}
            style={{
              width: showFrame ? `${currentWidth * zoom + 24}px` : `${currentWidth * zoom}px`,
              height: showFrame ? `${currentHeight * zoom + 24}px` : `${currentHeight * zoom}px`,
            }}
          >
            {/* 刘海/灵动岛 */}
            {showFrame && selectedDevice.hasNotch && !selectedDevice.hasDynamicIsland && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-20" />
            )}
            {showFrame && selectedDevice.hasDynamicIsland && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-8 bg-black rounded-full z-20" />
            )}

            {/* 屏幕内容 */}
            <div
              className="relative bg-white overflow-hidden"
              style={{
                width: `${currentWidth * zoom}px`,
                height: `${currentHeight * zoom}px`,
                borderRadius: showFrame ? `${12 * zoom}px` : '0',
              }}
            >
              {/* 状态栏模拟 */}
              {showFrame && (
                <div 
                  className="absolute top-0 left-0 right-0 bg-black/5 backdrop-blur-sm z-10 flex items-center justify-between px-4"
                  style={{ height: `${44 * zoom}px`, fontSize: `${12 * zoom}px` }}
                >
                  <span className="font-semibold text-gray-800">9:41</span>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                    </svg>
                    <svg className="w-4 h-4 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M17.778 8.232c-1.242-.592-2.65-.904-4.078-.904-1.43 0-2.837.312-4.079.904a.75.75 0 11-.643-1.352c1.41-.672 3.002-1.028 4.722-1.028 1.72 0 3.312.356 4.722 1.028a.75.75 0 11-.644 1.352zM14.5 11.25a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm-5.286-2.95a4.63 4.63 0 012.286-.595c.802 0 1.575.196 2.286.595a.75.75 0 11-.715 1.32 3.13 3.13 0 00-1.571-.43c-.548 0-1.08.148-1.57.43a.75.75 0 11-.716-1.32z" clipRule="evenodd" />
                    </svg>
                    <div className="w-5 h-2.5 border border-gray-800 rounded-sm relative">
                      <div className="absolute inset-0.5 bg-gray-800 rounded-sm" style={{ width: '60%' }} />
                    </div>
                  </div>
                </div>
              )}

              {/* 实际页面内容 */}
              <div 
                className="w-full h-full overflow-y-auto overflow-x-hidden"
                style={{ 
                  paddingTop: showFrame ? `${44 * zoom}px` : '0',
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left',
                  width: `${currentWidth}px`,
                  height: showFrame ? `${currentHeight - 44}px` : `${currentHeight}px`,
                }}
              >
                <div className="origin-top-left">
                  {children}
                </div>
              </div>

              {/* 底部横条（Home Indicator） */}
              {showFrame && (
                <div 
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-gray-800 rounded-full"
                  style={{ 
                    width: `${120 * zoom}px`, 
                    height: `${5 * zoom}px`,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
