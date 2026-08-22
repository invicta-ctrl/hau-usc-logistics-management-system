function BoldText() {
  return (
    <div className="relative shrink-0 w-full" data-name="Bold Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <p className="[word-break:break-word] font-['IBM_Plex_Mono:Bold',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#3a2b2e] text-[17px] tracking-[0.34px] uppercase whitespace-nowrap">Navigation drawer — three states</p>
      </div>
    </div>
  );
}

function Text() {
  return (
    <div className="relative shrink-0 w-full" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <p className="[word-break:break-word] font-['IBM_Plex_Mono:Regular',sans-serif] leading-[normal] not-italic relative shrink-0 text-[#6b585c] text-[13px] tracking-[-0.15px] whitespace-nowrap">V-31 closed contract · V-32 motion</p>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[4px] items-start relative size-full">
        <BoldText />
        <Text />
      </div>
    </div>
  );
}

function Heading() {
  return (
    <div className="relative shrink-0 w-full" data-name="Heading 1">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <p className="[word-break:break-word] font-['Bricolage_Grotesque:Bold',sans-serif] font-bold leading-[33px] relative shrink-0 text-[#241416] text-[30px] tracking-[-0.66px] whitespace-nowrap" style={{ fontVariationSettings: '"opsz" 14, "wdth" 100' }}>
          Navigation drawer states
        </p>
      </div>
    </div>
  );
}

function ParagraphMargin() {
  return (
    <div className="relative shrink-0" data-name="Paragraph:margin">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[8px] relative size-full">
        <p className="[word-break:break-word] font-['IBM_Plex_Sans:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[#6f5a60] text-[13px] tracking-[-0.15px] w-[531px]" style={{ fontVariationSettings: '"wdth" 100' }}>
          The reported defect was a closed sidebar that still covered content and swallowed focus. The closed state is therefore specified as strictly as the open one.
        </p>
      </div>
    </div>
  );
}

function Text1() {
  return (
    <div className="relative shrink-0 w-full" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <p className="[word-break:break-word] font-['IBM_Plex_Sans:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[#6f5a60] text-[10px] tracking-[1px] uppercase whitespace-nowrap" style={{ fontVariationSettings: '"wdth" 100' }}>
          1 · Closed
        </p>
      </div>
    </div>
  );
}

function BoldText1() {
  return <div className="bg-[#f6e29a] h-[1.5px] relative shrink-0 w-[15px]" data-name="Bold Text" />;
}

function BoldText2() {
  return <div className="bg-[#f6e29a] h-[1.5px] relative shrink-0 w-[15px]" data-name="Bold Text" />;
}

function BoldText3() {
  return <div className="bg-[#f6e29a] h-[1.5px] relative shrink-0 w-[15px]" data-name="Bold Text" />;
}

function ItalicText() {
  return (
    <div className="relative shrink-0" data-name="Italic Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[3px] items-start relative size-full">
        <BoldText1 />
        <BoldText2 />
        <BoldText3 />
      </div>
    </div>
  );
}

function Text2() {
  return (
    <div className="bg-[#610b0f] h-[40px] relative rounded-[10px] shrink-0" data-name="Text">
      <div aria-hidden className="absolute border border-[#78141a] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center px-[17px] py-px relative size-full">
        <ItalicText />
        <p className="[word-break:break-word] font-['IBM_Plex_Sans:SemiBold',sans-serif] font-semibold leading-[normal] relative shrink-0 text-[#faeecb] text-[13px] tracking-[-0.15px] whitespace-nowrap" style={{ fontVariationSettings: '"wdth" 100' }}>
          Navigate
        </p>
      </div>
    </div>
  );
}

function Container7() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center relative size-full">
        <Text2 />
      </div>
    </div>
  );
}

function Text3() {
  return <div className="absolute bg-gradient-to-r from-[rgba(230,220,201,0)] h-[18px] left-0 to-[rgba(230,220,201,0)] top-0 via-1/2 via-[#e6dcc9] w-[256.188px]" data-name="Text" />;
}

function Container8() {
  return (
    <div className="bg-[#f7f0e2] h-[18px] overflow-clip relative rounded-[6px] shrink-0 w-[256.188px]" data-name="Container">
      <Text3 />
    </div>
  );
}

function ContainerMargin() {
  return (
    <div className="relative shrink-0" data-name="Container:margin">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[16px] relative size-full">
        <Container8 />
      </div>
    </div>
  );
}

function Text4() {
  return <div className="absolute bg-gradient-to-r from-[rgba(230,220,201,0)] h-[18px] left-0 to-[rgba(230,220,201,0)] top-0 via-1/2 via-[#e6dcc9] w-[329.391px]" data-name="Text" />;
}

function Container9() {
  return (
    <div className="bg-[#f7f0e2] h-[18px] overflow-clip relative rounded-[6px] shrink-0 w-[329.391px]" data-name="Container">
      <Text4 />
    </div>
  );
}

function ContainerMargin1() {
  return (
    <div className="relative shrink-0" data-name="Container:margin">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[8px] relative size-full">
        <Container9 />
      </div>
    </div>
  );
}

function Text5() {
  return <div className="absolute bg-gradient-to-r from-[rgba(230,220,201,0)] h-[18px] left-0 to-[rgba(230,220,201,0)] top-0 via-1/2 via-[#e6dcc9] w-[183px]" data-name="Text" />;
}

function Container10() {
  return (
    <div className="bg-[#f7f0e2] h-[18px] overflow-clip relative rounded-[6px] shrink-0 w-[183px]" data-name="Container">
      <Text5 />
    </div>
  );
}

function ContainerMargin2() {
  return (
    <div className="relative shrink-0" data-name="Container:margin">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[8px] relative size-full">
        <Container10 />
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div className="absolute content-stretch flex flex-col items-start left-px p-[16px] top-px w-[398px]" data-name="Container">
      <Container7 />
      <ContainerMargin />
      <ContainerMargin1 />
      <ContainerMargin2 />
    </div>
  );
}

function Container5() {
  return (
    <div className="bg-[#fffdf8] h-[220px] relative rounded-[14px] shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <Container6 />
      </div>
      <div aria-hidden className="absolute border border-[#bda98c] border-solid inset-0 pointer-events-none rounded-[14px]" />
    </div>
  );
}

function Text6() {
  return (
    <div className="relative shrink-0 w-full" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <p className="[word-break:break-word] font-['IBM_Plex_Sans:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[#6f5a60] text-[11px] tracking-[-0.15px] w-[400px]" style={{ fontVariationSettings: '"wdth" 100' }}>
          Width 0. Removed from the focus order. No pointer, scroll or focus interception. Content occupies the full plane.
        </p>
      </div>
    </div>
  );
}

function Container4() {
  return (
    <div className="relative shrink-0 w-[400px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[12px] items-start relative size-full">
        <Text1 />
        <Container5 />
        <Text6 />
      </div>
    </div>
  );
}

function Text7() {
  return (
    <div className="relative shrink-0 w-full" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <p className="[word-break:break-word] font-['IBM_Plex_Sans:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[#6f5a60] text-[10px] tracking-[1px] uppercase whitespace-nowrap" style={{ fontVariationSettings: '"wdth" 100' }}>
          2 · Opening — 280 ms surface
        </p>
      </div>
    </div>
  );
}

function Container13() {
  return <div className="absolute bg-[rgba(36,20,22,0.2)] h-[218px] left-px top-px w-[398px]" data-name="Container" />;
}

function Container14() {
  return <div className="absolute bg-gradient-to-b from-[#6b0e13] h-[218px] left-px opacity-75 to-[#3d070a] top-px w-[206.953px]" data-name="Container" />;
}

function Container12() {
  return (
    <div className="bg-[#fffdf8] h-[220px] relative rounded-[14px] shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <Container13 />
        <Container14 />
      </div>
      <div aria-hidden className="absolute border border-[#bda98c] border-solid inset-0 pointer-events-none rounded-[14px]" />
    </div>
  );
}

function Text8() {
  return (
    <div className="relative shrink-0 w-full" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <p className="[word-break:break-word] font-['IBM_Plex_Sans:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[#6f5a60] text-[11px] tracking-[-0.15px] w-[400px]" style={{ fontVariationSettings: '"wdth" 100' }}>
          Transform and opacity only. Institutional easing, no bounce. Exit is shorter at 160 ms.
        </p>
      </div>
    </div>
  );
}

function Container11() {
  return (
    <div className="relative shrink-0 w-[400px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[12px] items-start relative size-full">
        <Text7 />
        <Container12 />
        <Text8 />
      </div>
    </div>
  );
}

function Text9() {
  return (
    <div className="relative shrink-0 w-full" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <p className="[word-break:break-word] font-['IBM_Plex_Sans:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[#6f5a60] text-[10px] tracking-[1px] uppercase whitespace-nowrap" style={{ fontVariationSettings: '"wdth" 100' }}>
          3 · Open — focus trapped
        </p>
      </div>
    </div>
  );
}

function Container17() {
  return <div className="absolute bg-[rgba(36,20,22,0.44)] h-[218px] left-px top-px w-[398px]" data-name="Container" />;
}

function BoldText4() {
  return <div className="bg-[#40070a] h-[1.5px] relative shrink-0 w-[15px]" data-name="Bold Text" />;
}

function BoldText5() {
  return <div className="bg-[#40070a] h-[1.5px] relative shrink-0 w-[15px]" data-name="Bold Text" />;
}

function BoldText6() {
  return <div className="bg-[#40070a] h-[1.5px] relative shrink-0 w-[15px]" data-name="Bold Text" />;
}

function ItalicText1() {
  return (
    <div className="relative shrink-0" data-name="Italic Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[3px] items-start relative size-full">
        <BoldText4 />
        <BoldText5 />
        <BoldText6 />
      </div>
    </div>
  );
}

function Text10() {
  return (
    <div className="bg-[#e8b93c] h-[40px] relative rounded-[10px] shrink-0" data-name="Text">
      <div aria-hidden className="absolute border border-[#c8992f] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[8px] items-center px-[17px] py-px relative size-full">
        <ItalicText1 />
        <p className="[word-break:break-word] font-['IBM_Plex_Sans:SemiBold',sans-serif] font-semibold leading-[normal] relative shrink-0 text-[#40070a] text-[13px] tracking-[-0.15px] whitespace-nowrap" style={{ fontVariationSettings: '"wdth" 100' }}>
          Close
        </p>
      </div>
    </div>
  );
}

function Container19() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center relative size-full">
        <Text10 />
      </div>
    </div>
  );
}

function Container20() {
  return <div className="bg-[#d9bfae] h-[10px] opacity-50 relative rounded-[3px] shrink-0 w-[155.891px]" data-name="Container" />;
}

function ContainerMargin3() {
  return (
    <div className="relative shrink-0" data-name="Container:margin">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[16px] relative size-full">
        <Container20 />
      </div>
    </div>
  );
}

function Container21() {
  return <div className="bg-[#d9bfae] h-[10px] opacity-50 relative rounded-[3px] shrink-0 w-[182.625px]" data-name="Container" />;
}

function ContainerMargin4() {
  return (
    <div className="relative shrink-0" data-name="Container:margin">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[10px] relative size-full">
        <Container21 />
      </div>
    </div>
  );
}

function Container22() {
  return <div className="bg-[#e8b93c] h-[10px] relative rounded-[3px] shrink-0 w-[133.625px]" data-name="Container" />;
}

function ContainerMargin5() {
  return (
    <div className="relative shrink-0" data-name="Container:margin">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[10px] relative size-full">
        <Container22 />
      </div>
    </div>
  );
}

function Container18() {
  return (
    <div className="absolute bg-gradient-to-b content-stretch flex flex-col from-[#6b0e13] items-start left-px p-[16px] to-[#3d070a] top-px w-[254.719px]" data-name="Container">
      <Container19 />
      <ContainerMargin3 />
      <ContainerMargin4 />
      <ContainerMargin5 />
    </div>
  );
}

function Container16() {
  return (
    <div className="bg-[#fffdf8] h-[220px] relative rounded-[14px] shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid overflow-clip relative rounded-[inherit] size-full">
        <Container17 />
        <Container18 />
      </div>
      <div aria-hidden className="absolute border border-[#bda98c] border-solid inset-0 pointer-events-none rounded-[14px]" />
    </div>
  );
}

function Text11() {
  return (
    <div className="relative shrink-0 w-full" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <p className="[word-break:break-word] font-['IBM_Plex_Sans:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[#6f5a60] text-[11px] tracking-[-0.15px] w-[400px]" style={{ fontVariationSettings: '"wdth" 100' }}>
          Dimmed backdrop, trapped focus, visible Close, Escape dismisses, focus returns to Navigate.
        </p>
      </div>
    </div>
  );
}

function Container15() {
  return (
    <div className="relative shrink-0 w-[400px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[12px] items-start relative size-full">
        <Text9 />
        <Container16 />
        <Text11 />
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="relative shrink-0 w-[1334px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex gap-[24px] items-start pt-[24px] relative size-full">
        <Container4 />
        <Container11 />
        <Container15 />
      </div>
    </div>
  );
}

function Text12() {
  return (
    <div className="relative shrink-0" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <p className="[word-break:break-word] font-['IBM_Plex_Sans:Regular','Noto_Sans:Regular','Noto_Sans_Math:Regular','Noto_Sans_Symbols:Regular','Noto_Sans_Symbols2:Regular',sans-serif] font-normal leading-[normal] relative shrink-0 text-[#23557f] text-[13px] tracking-[-0.15px] whitespace-nowrap" style={{ fontVariationSettings: '"wdth" 100' }}>
          ⓘ
        </p>
      </div>
    </div>
  );
}

function BoldText7() {
  return (
    <div className="h-[19px] relative shrink-0 w-[936.063px]" data-name="Bold Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-[2px] relative size-full">
        <p className="[word-break:break-word] font-['IBM_Plex_Sans:Bold',sans-serif] font-bold leading-[normal] relative shrink-0 text-[#23557f] text-[13px] tracking-[-0.15px] whitespace-nowrap" style={{ fontVariationSettings: '"wdth" 100' }}>
          Reduced motion
        </p>
      </div>
    </div>
  );
}

function Text13() {
  return (
    <div className="relative shrink-0 w-[936.063px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <BoldText7 />
        <p className="[word-break:break-word] font-['IBM_Plex_Sans:Regular',sans-serif] font-normal leading-[normal] min-w-full relative shrink-0 text-[#23557f] text-[13px] tracking-[-0.15px] w-[min-content]" style={{ fontVariationSettings: '"wdth" 100' }}>
          The slide is replaced by an instant state change. Focus behaviour, selection and route identity are unchanged — nothing about the contract depends on the animation.
        </p>
      </div>
    </div>
  );
}

function Container23() {
  return (
    <div className="bg-[#e4eefa] relative rounded-[10px] shrink-0 w-full" data-name="Container">
      <div aria-hidden className="absolute border border-[#b0cbe6] border-solid inset-0 pointer-events-none rounded-[10px]" />
      <div className="content-stretch flex gap-[12px] items-start p-[17px] relative size-full">
        <Text12 />
        <Text13 />
      </div>
    </div>
  );
}

function ContainerMargin6() {
  return (
    <div className="relative shrink-0 w-full" data-name="Container:margin">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pt-[24px] relative size-full">
        <Container23 />
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="bg-[#e9e0d0] relative shrink-0 w-full" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start p-[32px] relative size-full">
        <Heading />
        <ParagraphMargin />
        <Container3 />
        <ContainerMargin6 />
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="bg-[#e9e0d0] h-[544px] relative shrink-0 w-[1400px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start overflow-clip p-px relative rounded-[inherit] size-full">
        <Container2 />
      </div>
      <div aria-hidden className="absolute border border-[#b9ab97] border-solid inset-0 pointer-events-none shadow-[0px_10px_40px_0px_rgba(60,30,34,0.13)]" />
    </div>
  );
}

export default function NavigationDrawerThreeStates() {
  return (
    <div className="content-stretch flex flex-col gap-[16px] items-start relative size-full" data-name="Navigation drawer — three states">
      <Container />
      <Container1 />
    </div>
  );
}
