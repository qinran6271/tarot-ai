import Link from "next/link";


export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 flex justify-center">
      <div className="w-full max-w-[390px] min-h-screen bg-white flex flex-col items-center px-8 py-10">

        <h1 className="text-xl font-medium mt-4">
          Today's Card
        </h1>

        <div className="w-44 h-64 bg-yellow-200 rounded-xl mt-10" />

        <div className="mt-8 text-center">
          <p className="font-medium">
            今日运势：
          </p>

          <p className="text-gray-600 mt-2">
            。。。。。。。。。。。
            <br />
            。。。。。。。。。。。
          </p>
        </div>

        <Link
          href="/question"
          className="
            mt-auto
            mb-10
            px-10
            py-3
            border
            border-black
            rounded-full
            hover:bg-black
            hover:text-white
            transition
          "
        >
          开始旅程
        </Link>

      </div>
    </main>
  );
}