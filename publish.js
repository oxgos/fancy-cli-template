#!/usr/bin/env node
const path = require('path');
const cp = require('child_process');
const fse = require('fs-extra');
const inquirer = require('inquirer');
const semverInc = require('semver/functions/inc');

const versionLevels = ['major', 'minor', 'patch'];

// 读取文件夹目录
const files = fse.readdirSync('.');
const directories = files
  .filter((file) => {
    return !(
      file === 'node_modules' ||
      /.\.(json|js|md)$/.test(file) ||
      /^\./.test(file)
    );
  })
  .map((file) => ({
    name: file,
    value: file,
  }));

inquirer
  .prompt([
    {
      type: 'list',
      name: 'type',
      message: '请选择发布的模板',
      choices: directories,
    },
  ])
  .then((answer) => {
    const { type: template } = answer;
    // 模板package.json路径
    const pkgPath = path.join(__dirname, template, 'package.json');
    // 读取package.json
    const package = fse.readJsonSync(pkgPath);
    const { version } = package;
    const versions = versionLevels.map((level) => {
      const newVersion = semverInc(version, level);
      return {
        name: `发布${level}版本, 版本号为: ${newVersion}`,
        value: newVersion,
      };
    });

    inquirer
      .prompt([
        {
          type: 'list',
          name: 'type',
          message: '请选择发布版本',
          choices: versions,
        },
      ])
      .then((answer) => {
        const { type: version } = answer;
        const newPackage = Object.assign({}, package, {
          version,
        });
        // 更新package.json
        fse.writeJsonSync(pkgPath, newPackage);
        const spinner = startSpinner('Publishing');
        // 发布
        cp.exec(
          'npm publish',
          {
            cwd: path.resolve(__dirname, template), // 不加这参数，则基于命令执行目录 执行命令，加了这目录可以指定从哪个目录开始执行命令
          },
          function (error, stdout, stderr) {
            console.log(error);
            console.log(stdout);
            console.log(stderr);
            spinner.stop();
          }
        );
      })
      .catch((error) => {
        console.error(error);
      });
  })
  .catch((error) => {
    console.error(error);
  });

function startSpinner(msg, spinnerString = '|/-\\') {
  var Spinner = require('cli-spinner').Spinner;

  var spinner = new Spinner(msg + '.. %s');
  spinner.setSpinnerString(spinnerString);
  spinner.start();
  return spinner;
}
