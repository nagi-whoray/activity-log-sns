import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '利用規約 - Recowork',
  description: 'Recowork利用規約',
}

export default function TermsPage() {
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
          <h1 className="text-2xl font-bold mb-6 text-center">Recowork 利用規約</h1>

          <p className="text-sm text-gray-700 mb-6 leading-relaxed">
            本利用規約（以下「本規約」といいます。）は、日々の活動を記録し共有するSNSサービス「Recowork」（以下「本サービス」といいます。）の提供条件及び本サービスを利用する皆様（以下「ユーザー」といいます。）と、Recowork 運営事務局（以下「当事務局」といいます。）との間の権利義務関係を定めるものです。
          </p>

          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-3">第1条（適用）</h2>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-2 leading-relaxed">
              <li>本規約は、本サービスの利用に関する一切の関係に適用されます。</li>
              <li>ユーザーは、本サービスを利用することにより、本規約の全ての記載内容に同意したものとみなされます。</li>
              <li>本サービスに関して、本規約のほか、ガイドライン、ヘルプ、注意事項等（以下「個別規定」といいます。）を定める場合があります。これらは本規約の一部を構成するものとします。</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-3">第2条（ユーザー登録）</h2>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-2 leading-relaxed">
              <li>本サービスの利用を希望する者が、本規約に同意した上で、当事務局の定める方法によって利用登録の手続きを完了した時点で、ユーザーとしての登録が完了したものとします。</li>
              <li>当事務局は、ユーザー登録を完了した者が以下の事由に該当すると判断した場合、事前の通知なく利用登録の取り消し、またはサービスの利用停止等の措置を講じることがあります。
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                  <li>登録内容に虚偽の事項が含まれている場合</li>
                  <li>過去に本規約に違反したことがある者からの申請である場合</li>
                  <li>反社会的勢力等（暴力団、暴力団員、右翼団体、反社会的勢力、その他これに準ずる者を意味します。）である、または資金提供その他を通じて反社会的勢力等の維持、運営若しくは経営に協力若しくは関与する等反社会的勢力等との何らかの交流若しくは関与を行っていると当事務局が判断した場合</li>
                  <li>その他、当事務局がユーザー登録を不適切と判断した場合</li>
                </ul>
              </li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-3">第3条（アカウントの管理）</h2>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-2 leading-relaxed">
              <li>ユーザーは、自己の責任において、本サービスのアカウントおよびパスワードを適切に管理するものとします。</li>
              <li>ユーザーは、いかなる場合にも、アカウントおよびパスワードを第三者に譲渡または貸与し、もしくは第三者と共用することはできません。</li>
              <li>アカウントが第三者に利用されたことによって生じた損害は、当事務局に重過失がある場合を除き、当事務局は一切の責任を負わないものとします。</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-3">第4条（投稿コンテンツの権利）</h2>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-2 leading-relaxed">
              <li>ユーザーが本サービスに投稿したテキスト、画像、記録データ等（以下「投稿コンテンツ」といいます。）の著作権は、当該ユーザー自身に帰属します。</li>
              <li>ユーザーは、当事務局に対し、本サービスの提供、維持、改善、またはプロモーション（SNSでの紹介や活用事例としての掲載等）の目的に必要な範囲内で、投稿コンテンツを無償で非独占的に利用（複製、加工、公衆送信等）することを許諾するものとします。</li>
              <li>ユーザーは、他のユーザーが本サービスの機能（タイムラインでの閲覧等）を利用して、自身の投稿コンテンツを閲覧することに同意するものとします。</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-3">第5条（禁止事項）</h2>
            <p className="text-sm text-gray-700 mb-2 leading-relaxed">ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-2 leading-relaxed">
              <li>法令または公序良俗に違反する行為</li>
              <li>犯罪行為に関連する行為</li>
              <li>他のユーザー、第三者、または当事務局の知的財産権、プライバシー権、名誉権を侵害する行為</li>
              <li>本サービスの運営を妨害するおそれのある行為（サーバーへの過度な負荷等）</li>
              <li>虚偽の情報の投稿や、過度な射幸心を煽る行為</li>
              <li>他のユーザーに対する嫌がらせ、誹謗中傷、または公序良俗に反する接触</li>
              <li>営業、宣伝、広告、勧誘、その他営利を目的とする行為（当事務局の許可がある場合を除く）</li>
              <li>その他、当事務局が不適切と判断する行為</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-3">第6条（サービスの停止等）</h2>
            <p className="text-sm text-gray-700 mb-2 leading-relaxed">当事務局は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。</p>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-2 leading-relaxed">
              <li>本サービスに係るコンピュータシステムの保守点検または更新を行う場合</li>
              <li>天災地変などの不可抗力により、本サービスの提供が困難となった場合</li>
              <li>その他、当事務局が停止または中断が必要と判断した場合</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-3">第7条（利用制限および登録抹消）</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              当事務局は、ユーザーが本規約に違反した場合、事前の通知なく、投稿コンテンツの削除、ユーザーに対する本サービスの利用制限、またはユーザー登録の抹消を行うことができるものとします。これによってユーザーに生じた損害について、当事務局は一切の責任を負いません。
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-3">第8条（免責事項）</h2>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-2 leading-relaxed">
              <li>当事務局は、本サービスの内容について、その正確性、有用性、確実性等について保証するものではありません。</li>
              <li>本サービスを利用したこと、または利用できなかったことにより生じた損害について、当事務局の故意または重過失による場合を除き、当事務局は一切の責任を負いません。</li>
              <li>ユーザー同士、またはユーザーと第三者との間で生じたトラブルについて、当事務局は一切関与せず、ユーザー自身の責任で解決するものとします。</li>
            </ul>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-3">第9条（サービス内容の変更および終了）</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              当事務局は、ユーザーに通知することなく、本サービスの内容を変更しまたは本サービスの提供を中止することができるものとし、これによってユーザーに生じた損害について一切の責任を負いません。
            </p>
          </section>

          <section className="mb-6">
            <h2 className="text-lg font-semibold mb-3">第10条（規約の変更）</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              当事務局は、必要と判断した場合には、ユーザーに事前に通知することなくいつでも本規約を変更することができるものとします。なお、本規約の変更後、本サービスの利用を開始した場合には、当該ユーザーは変更後の規約に同意したものとみなします。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-lg font-semibold mb-3">第11条（準拠法・裁判管轄）</h2>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-2 leading-relaxed">
              <li>本規約の解釈にあたっては、日本法を準拠法とします。</li>
              <li>本サービスに関して紛争が生じた場合には、当事務局の所在地を管轄する裁判所を専属的合意管轄とします。</li>
            </ul>
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
