/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import path from 'path';
import fs from 'fs';
import findAndroidDir from './findAndroidDir';
import findManifest from './findManifest';
import findPackageClassName from './findPackageClassName';
import {
  AndroidProjectParams,
  AndroidProjectConfig,
  AndroidDependencyParams,
  AndroidDependencyConfig,
} from '@react-native-community/cli-types';
import {getPackageName} from './getAndroidProject';
import {findLibraryName} from './findLibraryName';
import {findComponentDescriptors} from './findComponentDescriptors';
import {findBuildGradle} from './findBuildGradle';

/**
 * Gets android project config by analyzing given folder and taking some
 * defaults specified by user into consideration
 */
export function projectConfig(
  root: string,
  userConfig: AndroidProjectParams = {},
): AndroidProjectConfig | null {
  const src = userConfig.sourceDir || findAndroidDir(root);

  if (!src) {
    return null;
  }

  const sourceDir = path.join(root, src);

  const appName = getAppName(sourceDir, userConfig.appName);

  const manifestPath = userConfig.manifestPath
    ? path.join(sourceDir, userConfig.manifestPath)
    : findManifest(path.join(sourceDir, appName));
  const buildGradlePath = findBuildGradle(sourceDir, false);

  if (!manifestPath) {
    return null;
  }

  const packageName =
    userConfig.packageName || getPackageName(manifestPath, buildGradlePath);

  if (!packageName) {
    throw new Error(`Package name not found in ${manifestPath}`);
  }

  return {
    sourceDir,
    appName,
    packageName,
    dependencyConfiguration: userConfig.dependencyConfiguration,
  };
}

function getAppName(sourceDir: string, userConfigAppName: string | undefined) {
  let appName = '';
  if (
    typeof userConfigAppName === 'string' &&
    fs.existsSync(path.join(sourceDir, userConfigAppName))
  ) {
    appName = userConfigAppName;
  } else if (fs.existsSync(path.join(sourceDir, 'app'))) {
    appName = 'app';
  }
  return appName;
}

/**
 * Same as projectConfigAndroid except it returns
 * different config that applies to packages only
 */
export function dependencyConfig(
  root: string,
  userConfig: AndroidDependencyParams | null = {},
): AndroidDependencyConfig | null {
  if (userConfig === null) {
    return null;
  }

  const src = userConfig.sourceDir || findAndroidDir(root);

  if (!src) {
    return null;
  }

  const sourceDir = path.join(root, src);
  const manifestPath = userConfig.manifestPath
    ? path.join(sourceDir, userConfig.manifestPath)
    : findManifest(sourceDir);
  const buildGradlePath = findBuildGradle(sourceDir, true);

  if (!manifestPath) {
    return null;
  }

  const packageName =
    userConfig.packageName || getPackageName(manifestPath, buildGradlePath);
  const packageClassName = findPackageClassName(sourceDir);

  /**
   * This module has no package to export
   */
  if (!packageClassName) {
    return null;
  }

  const packageImportPath =
    userConfig.packageImportPath ||
    `import ${packageName}.${packageClassName};`;

  const packageInstance =
    userConfig.packageInstance || `new ${packageClassName}()`;

  const buildTypes = userConfig.buildTypes || [];
  const dependencyConfiguration = userConfig.dependencyConfiguration;
  const libraryName =
    userConfig.libraryName || findLibraryName(root, sourceDir);
  const componentDescriptors =
    userConfig.componentDescriptors || findComponentDescriptors(root);
  const androidMkPath = userConfig.androidMkPath
    ? path.join(sourceDir, userConfig.androidMkPath)
    : path.join(sourceDir, 'build/generated/source/codegen/jni/Android.mk');
  const cmakeListsPath = userConfig.cmakeListsPath
    ? path.join(sourceDir, userConfig.cmakeListsPath)
    : path.join(sourceDir, 'build/generated/source/codegen/jni/CMakeLists.txt');

  return {
    sourceDir,
    packageImportPath,
    packageInstance,
    buildTypes,
    dependencyConfiguration,
    libraryName,
    componentDescriptors,
    androidMkPath,
    cmakeListsPath,
  };
}
