const fse = require('fs-extra');
const inquirer = require('inquirer');
const glob = require('glob');
const ejs = require('ejs');

async function ejsRender({ ignore, targetPath, data }) {
  const dir = targetPath;
  const projectInfo = data;
  return new Promise((resolve, reject) => {
    glob(
      '**',
      {
        cwd: dir,
        ignore: ignore,
        nodir: true, // 排除文件夹
      },
      (err, files) => {
        if (err) {
          reject(err);
        }
        Promise.all(
          files.map((file) => {
            const filePath = path.resolve(dir, file);
            return new Promise((resolve1, reject1) => {
              ejs.renderFile(filePath, projectInfo, {}, (err, result) => {
                if (err) {
                  reject1(err);
                } else {
                  // ejs后,需要重新写入文件
                  fse.writeFileSync(filePath, result);
                  resolve1(result);
                }
              });
            });
          })
        )
          .then(() => {
            resolve();
          })
          .catch((err) => {
            reject(err);
          });
      }
    );
  });
}

async function install(options) {
  const projectPrompt = [];
  const descriptionPrompt = {
    type: 'input',
    name: 'description',
    message: '请输入项目描述信息',
    validate: function (v) {
      const done = this.async();

      setTimeout(function () {
        if (!v) {
          done('请输入项目描述信息');
          return;
        }
        done(null, true);
      }, 0);
    },
  };
  projectPrompt.push(descriptionPrompt);
  const projectInfo = await inquirer.prompt(projectPrompt);
  options.projectInfo.description = projectInfo.description;
  try {
    const { sourcePath, targetPath } = options;
    console.log('sourcePath : ', sourcePath);
    console.log('targetPath : ', targetPath);
    // 确保相关目录存在，不存在则创建
    fse.ensureDirSync(sourcePath);
    fse.ensureDirSync(targetPath);
    // 拷贝
    fse.copySync(sourcePath, targetPath);
    const templateIgnore = options.templateInfo.ignore || [];
    const ignore = ['**/node_modules/**', ...templateIgnore];
    await ejsRender({ ignore, targetPath, data: options.projectInfo });
  } catch (e) {
    throw e;
  }
}

module.exports = install;
