#import "SceneDelegate.h"
#import "AppDelegate.h"
#import "RCTReactNativeFactory.h"
#import <RNKakaoLogins.h>
#import <React/RCTLinkingManager.h>

@implementation SceneDelegate

- (void)scene:(UIScene *)scene
willConnectToSession:(UISceneSession *)session
      options:(UISceneConnectionOptions *)connectionOptions
{
  UIWindowScene *windowScene = (UIWindowScene *)scene;
  self.window = [[UIWindow alloc] initWithWindowScene:windowScene];

  AppDelegate *appDelegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
  appDelegate.reactNativeFactory = [[RCTReactNativeFactory alloc] initWithDelegate:appDelegate];
  [appDelegate.reactNativeFactory startReactNativeWithModuleName:@"Neurous" inWindow:self.window];
}

- (void)scene:(UIScene *)scene openURLContexts:(NSSet<UIOpenURLContext *> *)URLContexts
{
  UIOpenURLContext *context = URLContexts.allObjects.firstObject;
  if (!context) return;

  NSURL *url = context.URL;
  if ([RNKakaoLogins isKakaoTalkLoginUrl:url]) {
    [RNKakaoLogins handleOpenUrl:url];
    return;
  }
  [RCTLinkingManager application:[UIApplication sharedApplication]
                          openURL:url
                          options:@{}];
}

@end
