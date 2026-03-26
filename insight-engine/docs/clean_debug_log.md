# 清除 jwt.ts 的 debug log
sed -i "s/console.log('\[MW VERIFY\]'.*)//" src/lib/jwt.ts
sed -i "s/console.log('\[MW VERIFY ERROR\]'.*)//" src/lib/jwt.ts

# 清除 middleware.ts 的 debug log
sed -i "/\[MW DEBUG\]/d" src/middleware.ts
sed -i "/\[MW SECRET CHECK\]/d" src/middleware.ts
sed -i "/\[MW AUTH\]/d" src/middleware.ts
sed -i "/ADMIN_SECRET_prefix/d" src/middleware.ts
sed -i "/JWT_SECRET_prefix/d" src/middleware.ts
sed -i "/NEXT_PUBLIC_prefix/d" src/middleware.ts
sed -i "/actualUsed/d" src/middleware.ts
sed -i "/tokenLength/d" src/middleware.ts
sed -i "/dotCount/d" src/middleware.ts
sed -i "/first20/d" src/middleware.ts

# 清除 login route 的 debug log
sed -i "/\[LOGIN SECRET CHECK\]/d" src/app/api/auth/login/route.ts

# 確認結果
echo "=== 檢查殘留 debug log ==="
grep -rn "MW DEBUG\|MW VERIFY\|MW AUTH\|MW SECRET\|LOGIN SECRET" src/lib/jwt.ts src/middleware.ts src/app/api/auth/login/route.ts