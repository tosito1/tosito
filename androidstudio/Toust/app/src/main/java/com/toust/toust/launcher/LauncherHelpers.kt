package com.toust.toust.launcher

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.provider.Settings

fun launchApp(ctx: Context, info: AppInfo) {
    ctx.packageManager.getLaunchIntentForPackage(info.packageName)
        ?.apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) }
        ?.let { runCatching { ctx.startActivity(it) } }
}

fun openAppInfo(ctx: Context, pkg: String) {
    runCatching {
        ctx.startActivity(
            Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
                .setData(Uri.fromParts("package", pkg, null))
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        )
    }
}

fun uninstallApp(ctx: Context, pkg: String) {
    runCatching {
        ctx.startActivity(
            Intent(Intent.ACTION_DELETE)
                .setData(Uri.parse("package:$pkg"))
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        )
    }
}
