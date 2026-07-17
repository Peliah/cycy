import React from 'react'
import { Menu } from 'lucide-react'
import { Sheet ,SheetContent,SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { SideBar } from '@/components/layout/side-bar'
import { ServerSideBar } from '@/components/layout/server-side-bar'
export  function MobileToggle({serverId}: {serverId: string}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className='md:hidden'>
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex gap-0 border-shell-border bg-shell-nav p-0">
        <div className="w-[72px]">
          <SideBar />
        </div>
        <div className="w-60">
          <ServerSideBar serverId={serverId} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
