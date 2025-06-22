// 测试路径修复的脚本
const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testPathFix() {
    console.log('🧪 测试路径修复...\n');

    // 测试1：空路径（应该使用用户下载文件夹）
    console.log('📁 测试1：空路径（应该使用用户下载文件夹）');
    try {
        const response = await axios.post(`${API_BASE}/download`, {
            url: 'https://www.bilibili.com/video/BV1vtMxzBERK/',
            outputPath: ''
        });
        console.log('✅ 空路径测试成功:', response.data);
    } catch (error) {
        console.log('❌ 空路径测试失败:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 测试2：绝对路径
    console.log('📁 测试2：绝对路径');
    try {
        const response = await axios.post(`${API_BASE}/download`, {
            url: 'https://www.bilibili.com/video/BV1vtMxzBERK/',
            outputPath: 'C:\\Users\\cmliuss\\Desktop\\test-videos'
        });
        console.log('✅ 绝对路径测试成功:', response.data);
    } catch (error) {
        console.log('❌ 绝对路径测试失败:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 测试3：用户下载文件夹
    console.log('📁 测试3：用户下载文件夹');
    try {
        const response = await axios.post(`${API_BASE}/download`, {
            url: 'https://www.bilibili.com/video/BV1vtMxzBERK/',
            outputPath: 'C:\\Users\\cmliuss\\Downloads'
        });
        console.log('✅ 用户下载文件夹测试成功:', response.data);
    } catch (error) {
        console.log('❌ 用户下载文件夹测试失败:', error.response?.data || error.message);
    }

    console.log('\n🎯 测试完成！');
}

// 运行测试
testPathFix().catch(console.error);
