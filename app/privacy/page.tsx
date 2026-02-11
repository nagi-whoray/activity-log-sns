import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'プライバシーポリシー - Recowork',
  description: 'Recoworkプライバシーポリシー',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/login" className="flex items-center gap-2 hover:opacity-80">
            <Image src="/recowork-logo.png" alt="Recowork" width={32} height={32} />
            <span className="font-bold text-lg">Recowork</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
          <h1 className="text-2xl font-bold mb-6 text-center">プライバシーポリシー</h1>

          <p className="text-sm text-gray-700 mb-6 leading-relaxed">
            Recowork 運営事務局（以下「当事務局」といいます。）は、本サービス「Recowork」（以下「本サービス」といいます。）におけるユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます。）を定めます。
          </p>

          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-3">1. 収集する情報</h2>
            <p className="text-sm text-gray-700 mb-2 leading-relaxed">当事務局は、本サービスの提供にあたり、以下の情報を取得する場合があります。</p>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-2 leading-relaxed">
              <li><strong>ユーザー登録情報:</strong> メールアドレス、ユーザー名、プロフィール画像、パスワード等</li>
              <li><strong>投稿コンテンツ:</strong> ユーザーが本サービス上に記録・投稿したテキスト、画像、数値データ等</li>
              <li><strong>利用状況に関する情報:</strong> IPアドレス、ブラウザ情報、端末識別子、アクセスログ、クッキー（Cookie）情報、その他本サービス内での行動履歴</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-3">2. 利用目的</h2>
            <p className="text-sm text-gray-700 mb-2 leading-relaxed">当事務局は、収集した情報を以下の目的で利用します。</p>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-2 leading-relaxed">
              <li>本サービスの提供、維持、保護及び改善のため</li>
              <li>ユーザー認証および本人確認のため</li>
              <li>本サービスに関するご案内、お問い合わせ等への対応のため</li>
              <li>本規約に違反する行為への対応のため</li>
              <li>本サービスの新機能開発やマーケティング分析のため</li>
              <li>個人を特定できない形式に加工した統計データの作成および利用のため</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-3">3. 投稿コンテンツの公開範囲</h2>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-2 leading-relaxed">
              <li>本サービスはSNSであり、ユーザーが投稿したコンテンツは、本サービス上の他のユーザーに対して公開されることを前提としています。</li>
              <li>公開を望まない情報については、ユーザー自身の責任において投稿を控える、または本サービス内の設定（設定機能がある場合）を利用して管理するものとします。</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-3">4. 第三者提供</h2>
            <p className="text-sm text-gray-700 mb-2 leading-relaxed">当事務局は、次に掲げる場合を除いて、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。</p>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-2 leading-relaxed">
              <li>法令に基づく場合</li>
              <li>人の生命、身体または財産の保護のために必要がある場合であって、本人の同意を得ることが困難であるとき</li>
              <li>公衆衛生の向上または児童の健全な育成の推進のために特に必要がある場合であって、本人の同意を得ることが困難であるとき</li>
              <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合</li>
              <li>合併その他の事由による事業の承継に伴って個人情報が提供される場合</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-3">5. 個人情報の安全管理</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              当事務局は、取り扱う個人情報の漏洩、滅失または毀損の防止その他の個人情報の安全管理のために必要かつ適切な措置を講じます。
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-3">6. クッキー（Cookie）および分析ツールの利用</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              本サービスでは、サービスの利便性向上や利用状況の解析のために、クッキー（Cookie）およびGoogle Analytics等の外部分析ツールを使用する場合があります。ユーザーはブラウザの設定によりクッキーを無効にすることができますが、その場合、本サービスの一部機能が利用できなくなる可能性があります。
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-3">7. 個人情報の開示・訂正・削除</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              ユーザーは、当事務局に対し、自身の個人情報の開示、訂正、追加、削除、利用停止等を求めることができます。当事務局は、本人確認を行った上で、法令の定めに従い遅滞なく対応いたします。
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-3">8. 本ポリシーの変更</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              当事務局は、必要に応じて本ポリシーを変更することがあります。変更した場合には、本サービス内での告知、または当事務局が定める方法によりユーザーに通知します。変更後の本ポリシーは、本サービス上に掲載した時点から効力を生じるものとします。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">9. お問い合わせ窓口</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              本ポリシーに関するお問い合わせは、本サービス内のお問い合わせフォームまたは当事務局が指定する方法によりご連絡ください。
            </p>
          </section>

          <div className="text-center text-sm text-gray-500 border-t pt-4">
            <p>以上</p>
            <p className="mt-1">2026年2月11日 制定</p>
          </div>
        </div>
      </main>
    </div>
  )
}
