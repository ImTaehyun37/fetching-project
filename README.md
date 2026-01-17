# Fetching Project - Backend Assignment

## 프로젝트 개요
이 프로젝트는 NestJS를 기반으로 구축된 이커머스 백엔드 서비스입니다.
상품 관리(CRUD), 유저 권한 관리(Admin/Seller/User), 인증(JWT), 그리고 상품 필터링 및 정렬 기능을 제공합니다.

## 요구사항 충족 여부 및 구현 설명

| 요구사항 | 구현 여부 | 상세 설명 및 코드 위치 |
| :--- | :---: | :--- |
| **1. JWT 기반 로그인** | O | `OAuthModule`, `AuthService` (로그인/회원가입), `JwtStrategy` (쿠키 추출 및 검증), `JwtAuthGuard`를 통해 구현되었습니다. |
| **2. 상품 정보 CRUD** | O | - **Create**: `create_process` (트랜잭션으로 Product+Option 동시 생성)<br>- **Read**: `getHome` (리스트), `getProductDetail` (상세)<br>- **Update**: `update_process` (옵션 재고 수정 및 추가)<br>- **Delete**: `delete_process` (Cascade 설정으로 안전 삭제) |
| **3. 상품 정보 필수 항목** | O | - **기본**: 이름, 설명, 가격 (`Product.entity.ts`)<br>- **관계**: 브랜드 (`Brand.entity.ts`)<br>- **옵션**: 사이즈, 색상 (`ProductInfo.entity.ts`) |
| **4. 필터링 (최소 3개)** | O | `AppService.getHome` 메서드 구현:<br>1. `brand_id` (브랜드 필터)<br>2. `min_price` ~ `max_price` (가격 범위)<br>3. `qs` (상품명 검색) |
| **5. 정렬 (최소 3개)** | O | `AppService.getHome` 메서드 구현:<br>1. `newest` (최신순)<br>2. `price_asc` (낮은 가격순)<br>3. `price_desc` (높은 가격순)<br>4. `like_desc` (좋아요순) |
| **6. 유저 관련 기능** | O | 1. **좋아요**: `likeProduct` (Count 증가)<br>2. **리뷰**: `createReview`, `Review.entity.ts` |

## 주요 특징

### 1. 권한 관리 (RBAC)
- **UserRole 구분**: `ADMIN`, `SELLER`, `USER`로 권한을 분리하였습니다.
- **소유권 검증**: `SELLER` 권한의 유저는 본인의 브랜드 상품만 관리할 수 있도록 `ProductService` 내에 소유권 검증 로직(`product.brand_id !== user.brandId`)을 구현하였습니다.

### 2. 데이터베이스 설계
- **1:N 관계 및 정규화**: `Product`와 `ProductInfo`(옵션)를 분리하여 하나의 상품에 다양한 사이즈/색상 재고를 유연하게 관리합니다.
- **Cascade**: 부모 데이터 삭제 시 자식 데이터가 자동으로 정리되도록 구성하였습니다.

### 3. 예외 처리 및 UX
- **ForbiddenExceptionFilter**: 권한 없는 접근 시 단순히 에러 JSON을 반환하는 대신, 알림(`alert`) 후 이전 페이지로 리다이렉트하여 SSR 환경에서의 사용자 경험을 고려하였습니다.
- **UI 조건부 렌더링**: 로그인 상태 및 권한에 따라 버튼(수정/삭제 등) 노출 여부를 동적으로 제어합니다.

---

## 🚀 실행 방법 (How to Run)

### 1. 패키지 설치
프로젝트 루트 경로에서 의존성 패키지를 설치합니다.
```
bash
npm install
```

### 2. 환경 변수 설정 (.env)
루트 경로에 `.env` 파일을 생성하고 아래 내용을 입력해주세요.
(`example.env` 파일을 참고하셔도 됩니다.)

> **Note**: 편의상 `example.env`에 기본값들을 기재해두었습니다.

```
env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=0000        
DB_DATABASE=fetching1
JWT_SECRET=secretKey    
```

### 3. 서버 실행
```
bash
npm run start
```
서버가 실행되면 [http://localhost:3000](http://localhost:3000)으로 접속하여 확인하실 수 있습니다.

---

## ⚠️ 참고 사항

### Synchronize: true
`app.module.ts`의 TypeORM 설정에서 `synchronize: true` 옵션이 활성화되어 있습니다.
- **이유**: 별도의 마이그레이션 없이 서버 실행 시 자동으로 DB 스키마(Table)가 생성되도록 하기 위함입니다.
- **주의**: 실제 배포 환경에서는 데이터 손실 위험이 있으므로 `false`로 설정하고 Migration을 사용해야 합니다.